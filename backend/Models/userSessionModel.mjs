import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
    user_id: {
        type: String,
        required: true
    },
    session_id: {
        type: String,
        required: true
    },
    login_timestamp: Number,
    logout_timestamp: Number,
    actions: [
        {
            page: String,
            timestamp: Number
        }
    ],
    trust_score: Number,
    rule_risk: Number,
    behavior_risk: Number,
    drift_flag: Boolean,
    is_safe: Boolean,
    reasons: [String]
});
const UserSession = mongoose.model("UserSession", sessionSchema);
export default UserSession;