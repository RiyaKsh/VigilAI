import UserSession from "../Models/userSessionModel.mjs";
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