import User from "../Models/userModel.js";
import bcrypt from "bcryptjs";
import generateToken from "../utils/generateToken.js";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import UserSession from "../Models/userSessionModel.mjs";
import { calculateRisk } from "../services/adaptiveRiskEngine.js";
import { activeSessions } from "../services/sessionService.js";

export const registerUser = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({ message: "Please fill all fields" });
        }
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: "User already exists" });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const user = await User.create({
            username,
            email,
            password: hashedPassword,
        });
        if (user) {
            res.status(201).json({
                _id: user._id,
                username: user.username,
                email: user.email,
                token: generateToken(user._id),
            });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Please provide email and password" });
        }
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            const log = {
            event: "login_failed",
            timestamp: Date.now(),
            user_id: user?._id || "unknown"
        };

        // send to threat model
        await axios.post("http://localhost:8000/threat-detection", {
            logs: [log]
        });

        return res.status(401).json({
            message: "Invalid email or password"
        });
        }
        const token = generateToken(user._id);
        const session_id = uuidv4();
        activeSessions[user._id] = {
        user_id: user._id,
        session_id: session_id,
        login_timestamp: Date.now(),

        actions: [],

        trust_score: 100,
        behavior_risk: 0,
        threat_score: 0,

        risk_score: 0,
        risk_level: "LOW",

        drift_flag: false,
        reasons: []
    };
        console.log("Active Sessions:", activeSessions);
        res.status(200).json({
            _id: user._id,
            username: user.username,
            email: user.email,
            session_id: session_id,
            token: token
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password required" });
        }
        const admin = await User.findOne({ email });
        if (!admin) {
            return res.status(401).json({ message: "Admin not found" });
        }
        // check if email is admin
        if (admin.email !== "admin@gmail.com") {
            return res.status(403).json({ message: "Not authorized as admin" });
        }
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        res.status(200).json({
            message: "Admin login successful",
            adminId: admin._id,
            token: generateToken(admin._id)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const trackAction = async (req, res) => {
    try {

        const { user_id, page, event } = req.body;
        const session = activeSessions[user_id];

        if (!session) {
            return res.status(400).json({
                message: "No active session"
            });
        }

        // store action
        const action = {
            page: page,
            event: event,
            timestamp: Date.now()
        };

        session.actions.push(action);
        console.log("Session actions:", session.actions);

        // run live monitoring every 5 actions
        if (session.actions.length % 5 === 0) {
            console.log("Running ML monitoring...");
            try {

                // -------- Behavior Model Payload --------
                const behaviorPayload = {
                    user_id: user_id,
                    session_id: session.session_id,
                    login_timestamp: session.login_timestamp,
                    logout_timestamp: Date.now(),
                    actions: session.actions.map(a => ({
                        page: a.page,
                        timestamp: a.timestamp
                    }))
                };

                // -------- Threat Model Payload --------
                const threatLogs = session.actions.map(a => ({
                    event: a.event,
                    timestamp: a.timestamp,
                    user_id: user_id
                }));

                const threatPayload = {
                    logs: threatLogs
                };

                // call behavior model
                console.log("Calling behavior model...");
                const behaviorResponse = await axios.post(
                    "http://localhost:8000/evaluate-session",
                    behaviorPayload
                );
                console.log("Behavior response:", behaviorResponse.data);
                console.log("Calling threat model...");
                // call threat model
                const threatResponse = await axios.post(
                    "http://localhost:8000/evaluate-threat",
                    threatPayload
                );
                console.log("Threat response:", threatResponse.data);


                // store live risk
                session.trust_score = behaviorResponse.data.trust_score;
                session.behavior_risk = behaviorResponse.data.behavior_risk;
                session.rule_risk = threatResponse.data.rule_risk;
                session.threat_score = threatResponse.data.final_threat_score;
                session.drift_flag = behaviorResponse.data.drift_flag;

                //calculate risk
                const riskResult = calculateRisk(
                session.trust_score,
                session.behavior_risk,
                session.threat_score,
                session.drift_flag
                );

                session.risk_score = riskResult.risk_score;
                session.risk_level = riskResult.risk_level;
                session.action = riskResult.action;
                // combine reasons
                session.reasons = [
                    ...(behaviorResponse.data.reasons || []),
                    ...(threatResponse.data.reasons || [])
                ];

                // safety decision
                session.is_safe = session.risk_level !== "CRITICAL";

            } catch (error) {
        console.log("Live ML monitoring failed:", error.message);
        if (error.response) {
            console.log("ML response error:", error.response.data);
        }
    }

        }
        

        res.json({
        message: "Action recorded",

        is_safe: session.is_safe ?? true,

        trust_score: session.trust_score,
        threat_score: session.threat_score,
        risk_score: session.risk_score,
        risk_level: session.risk_level,
        action: session.action,

        drift_flag: session.drift_flag,
        reasons: session.reasons
    });

    } catch (err) {

        res.status(500).json({
            error: err.message
        });

    }
};

export const logoutUser = async (req, res) => {
    try {
        const { user_id } = req.body;
        const session = activeSessions[user_id];
        if (!session) {
            return res.status(400).json({
                message: "No active session"
            });
        }
        const logout_timestamp = Date.now();
        const sessionData = {
            user_id: user_id,
            session_id: session.session_id,
            login_timestamp: session.login_timestamp,
            logout_timestamp: logout_timestamp,
            actions: session.actions
        };
        let mlResult = {};
        try {
            const response = await axios.post(
                "http://localhost:8000/evaluate-session",
                sessionData
            );
            mlResult = response.data;
        } catch (error) {
            console.log("ML service not reachable");
        }
        await UserSession.create({
            ...sessionData,
            ...mlResult,

            trust_score: session.trust_score,
            behavior_risk: session.behavior_risk,
            threat_score: session.threat_score,

            risk_score: session.risk_score,
            risk_level: session.risk_level,
            action: session.action,

            drift_flag: session.drift_flag,
            reasons: session.reasons
        });
        delete activeSessions[user_id];
        res.json({
            message: "Logout successful",
            session_saved: true
        });
    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
};