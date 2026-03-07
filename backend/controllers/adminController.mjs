import UserSession from "../Models/userSessionModel.mjs";
import { activeSessions } from "../services/sessionService.js";


export const getAllSessions = async (req, res) => {
    try {

        const sessions = await UserSession
            .find()
            .sort({ login_timestamp: -1 });

        const formatted = sessions.map(s => ({
            user_id: s.user_id,
            trust_score: s.trust_score,
            behavior_risk: s.behavior_risk,
            threat_score: s.threat_score,
            is_safe: s.is_safe,
            reasons: s.reasons,
            login_time: s.login_timestamp
        }));

        res.json(formatted);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getUsersRisk = (req, res) => {
    try {

        const users = Object.values(activeSessions).map(session => ({
            user_id: session.user_id,
            trust_score: session.trust_score ?? 100,
            threat_score: session.threat_score ?? 0,
            risk_score: session.risk_score ?? 0,
            risk_level: session.risk_level ?? "LOW"
        }));

        res.json(users);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getUserSession = (req, res) => {

    const { user_id } = req.params;

    const session = activeSessions[user_id];

    if (!session) {
        return res.status(404).json({
            message: "User session not found"
        });
    }

    res.json({
        user_id: session.user_id,
        trust_score: session.trust_score,
        threat_score: session.threat_score,
        risk_score: session.risk_score,
        risk_level: session.risk_level,
        drift_flag: session.drift_flag,
        reasons: session.reasons,
        actions: session.actions
    });

};

export const getAlerts = (req, res) => {

    const alerts = Object.values(activeSessions)
        .filter(session => session.risk_level === "HIGH" || session.risk_level === "CRITICAL")
        .map(session => ({
            user_id: session.user_id,
            risk_level: session.risk_level,
            risk_score: session.risk_score,
            reasons: session.reasons
        }));

    res.json(alerts);

};




export const getSessionDetails = async (req, res) => {
    try {

        const { session_id } = req.params;

        const session = await UserSession.findOne({ session_id });

        if (!session) {
            return res.status(404).json({
                message: "Session not found"
            });
        }

        res.json({
            user_id: session.user_id,
            session_id: session.session_id,

            login_timestamp: session.login_timestamp,
            logout_timestamp: session.logout_timestamp,

            trust_score: session.trust_score,
            threat_score: session.threat_score,

            risk_score: session.risk_score,
            risk_level: session.risk_level,
            action: session.action,

            drift_flag: session.drift_flag,
            reasons: session.reasons,

            actions: session.actions
        });

    } catch (error) {

        res.status(500).json({
            error: error.message
        });

    }
};




export const getLiveAlerts = (req, res) => {
    try {

        const alerts = Object.values(activeSessions)
            .filter(session => session.risk_level === "HIGH" || session.risk_level === "CRITICAL")
            .map(session => ({
                user_id: session.user_id,
                session_id: session.session_id,

                risk_score: session.risk_score,
                risk_level: session.risk_level,

                action: session.action,
                reasons: session.reasons
            }));

        res.json({
            total_alerts: alerts.length,
            alerts: alerts
        });

    } catch (error) {

        res.status(500).json({
            error: error.message
        });

    }
};