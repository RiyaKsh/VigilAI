import mongoose from "mongoose";

const baselineSchema = new mongoose.Schema({
  feature_history: {
    type: [[Number]],   // array of feature vectors
    default: []
  },
  avg_login_hour: Number,
  std_login_hour: Number,
  avg_actions_per_minute: Number,
  std_actions_per_minute: Number,
  avg_session_duration: Number,
  std_session_duration: Number,
  avg_unique_pages: Number
});
const riskMemorySchema = new mongoose.Schema({
  last_10_behavior_risks: [Number]
});
const modelMetadataSchema = new mongoose.Schema({
  safe_session_count: {
    type: Number,
    default: 0
  },
  last_trained_at: Date
});
const userProfileSchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  baseline: baselineSchema,
  risk_memory: riskMemorySchema,
  model_metadata: modelMetadataSchema
}, { timestamps: true });

export default mongoose.model("UserProfile", userProfileSchema);