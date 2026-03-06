import User from "../Models/userModel.js";
import bcrypt from "bcryptjs";
import generateToken from "../utils/generateToken.js";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import UserSession from "../Models/userSessionModel.mjs";

const activeSessions = {};

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
            return res.status(401).json({ message: "Invalid email or password" });
        }
        const token = generateToken(user._id);
        const session_id = uuidv4();
        activeSessions[user._id] = {
            session_id: session_id,
            login_timestamp: Date.now(),
            actions: []
        };
        res.status(200).json({
            _id: user._id,
            username: user.username,
            email: user.email,
            session_id: session_id,
            token: Token
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

export const trackAction = (req, res) => {
    const { user_id, page } = req.body;
    const session = activeSessions[user_id];
    if (!session) {
        return res.status(400).json({
            message: "No active session"
        });
    }
    session.actions.push({
        page,
        timestamp: Date.now()
    });
    res.json({
        message: "Action recorded"
    });
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
            ...mlResult
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