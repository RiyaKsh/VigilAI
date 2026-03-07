import { activeSessions } from "../services/sessionService.js";

export const getSessionStatus = (req, res) => {
    try {

        const { user_id } = req.params;

        const session = activeSessions[user_id];

        if (!session) {
            return res.status(404).json({
                message: "Session not found"
            });
        }

        res.json({
            session_id: session.session_id,
            login_timestamp: session.login_timestamp,

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