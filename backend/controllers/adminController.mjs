import UserSession from "../Models/userSessionModel.mjs";
export const getAllSessions = async (req, res) => {
    try {

        const sessions = await UserSession
            .find()
            .sort({ login_timestamp: -1 });

        res.status(200).json({
            count: sessions.length,
            sessions: sessions
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }
};