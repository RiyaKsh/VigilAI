import numpy as np
from feature_extractor import extract_features
from model import BehaviorModel
from behavior_rules import evaluate_behavior_rules
from risk_memory import update_risk_memory
from adaptive_learning import update_baseline

# -------------------------------
# Sample baseline sessions (safe)
# -------------------------------
baseline_sessions = [
    {
        "user_id": "U123",
        "login_timestamp": 1708003200,
        "logout_timestamp": 1708003800,
        "actions": [
            {"page": "dashboard", "timestamp": 1708003210},
            {"page": "files", "timestamp": 1708003220},
            {"page": "settings", "timestamp": 1708003250},
        ]
    },
    {
        "user_id": "U123",
        "login_timestamp": 1708004200,
        "logout_timestamp": 1708004800,
        "actions": [
            {"page": "dashboard", "timestamp": 1708004210},
            {"page": "files", "timestamp": 1708004230},
            {"page": "files", "timestamp": 1708004260},
        ]
    },
    {
        "user_id": "U123",
        "login_timestamp": 1708005200,
        "logout_timestamp": 1708005800,
        "actions": [
            {"page": "dashboard", "timestamp": 1708005210},
            {"page": "reports", "timestamp": 1708005230},
            {"page": "reports", "timestamp": 1708005260},
        ]
    }
]

# -------------------------------
# Simulated Risk Memory Storage
# -------------------------------
user_history = {
    "last_10_behavior_risks": []
}

# -------------------------------
# Feature dict → vector
# -------------------------------
def feature_dict_to_vector(features):
    return [
        features["login_hour"],
        features["session_duration"],
        features["actions_count"],
        features["actions_per_minute"],
        features["avg_time_between_actions"],
        features["click_variance"],
        features["unique_pages_visited"]
    ]


# -------------------------------
# TRAIN MODEL
# -------------------------------
model = BehaviorModel()

training_vectors = []

for session in baseline_sessions:
    features = extract_features(session)
    vector = feature_dict_to_vector(features)
    training_vectors.append(vector)

model.train(training_vectors)

print("Model trained successfully.\n")

# -------------------------------
# COMPUTE BASELINE STATS FOR RULE ENGINE
# -------------------------------

all_features = []

for session in baseline_sessions:
    f = extract_features(session)
    all_features.append(f)

baseline = {
    "feature_history": training_vectors.copy(),

    "avg_login_hour": np.mean([f["login_hour"] for f in all_features]),
    "std_login_hour": np.std([f["login_hour"] for f in all_features]),

    "avg_actions_per_minute": np.mean([f["actions_per_minute"] for f in all_features]),
    "std_actions_per_minute": np.std([f["actions_per_minute"] for f in all_features]),

    "avg_session_duration": np.mean([f["session_duration"] for f in all_features]),
    "std_session_duration": np.std([f["session_duration"] for f in all_features]),

    "avg_unique_pages": np.mean([f["unique_pages_visited"] for f in all_features])
}

print("Baseline statistics computed.\n")
SAFE_THRESHOLD = 40
# -------------------------------
# TEST NORMAL SESSION
# -------------------------------
normal_session = baseline_sessions[0]
features = extract_features(normal_session)
vector = feature_dict_to_vector(features)

trust_score = model.predict(vector)
trust_risk = 100 - trust_score

rule_risk, reasons = evaluate_behavior_rules(features, baseline)

behavior_risk = (0.6 * trust_risk) + (0.4 * rule_risk)

# RISK MEMORY ADJUSTMENT
memory_result = update_risk_memory(user_history, behavior_risk)

user_history["last_10_behavior_risks"] = memory_result["last_10_behavior_risks"]

if memory_result["drift_flag"]:
    behavior_risk += 10  # small amplification
    behavior_risk = min(behavior_risk, 100)
    print("Progressive drift detected!")

drift_flag = memory_result["drift_flag"]

# ADAPTIVE BASELINE UPDATE
if behavior_risk < SAFE_THRESHOLD and not drift_flag:
    baseline = update_baseline(baseline, vector)
    print("Baseline updated (normal session).")
else:
    print("Baseline NOT updated (session suspicious).")

print("Updated Risk History:", user_history["last_10_behavior_risks"])

print("Normal session trust score:", trust_score)
print("Rule Risk:", rule_risk)
print("Final Behavior Risk:", behavior_risk)
print("Reasons:", reasons, "\n")

# -------------------------------
# TEST ABNORMAL SESSION
# -------------------------------
abnormal_session = {
    "user_id": "U123",
    "login_timestamp": 1708020000,
    "logout_timestamp": 1708020100,
    "actions": [
        {"page": "admin", "timestamp": 1708020001},
        {"page": "admin", "timestamp": 1708020002},
        {"page": "admin", "timestamp": 1708020003},
        {"page": "admin", "timestamp": 1708020004},
        {"page": "admin", "timestamp": 1708020005},
    ]
}

features = extract_features(abnormal_session)
vector = feature_dict_to_vector(features)

trust_score = model.predict(vector)
trust_risk = 100 - trust_score

rule_risk, reasons = evaluate_behavior_rules(features, baseline)

behavior_risk = (0.6 * trust_risk) + (0.4 * rule_risk)
# RISK MEMORY ADJUSTMENT

memory_result = update_risk_memory(user_history, behavior_risk)

user_history["last_10_behavior_risks"] = memory_result["last_10_behavior_risks"]

if memory_result["drift_flag"]:
    behavior_risk += 10  # small amplification
    behavior_risk = min(behavior_risk, 100)
    print("Progressive drift detected!")

drift_flag = memory_result["drift_flag"]

# ADAPTIVE BASELINE UPDATE
if behavior_risk < SAFE_THRESHOLD and not drift_flag:
    baseline = update_baseline(baseline, vector)
    print("Baseline updated (abnormal session).")
else:
    print("Baseline NOT updated (session suspicious).")
print("Updated Risk History:", user_history["last_10_behavior_risks"])

print("Abnormal session trust score:", trust_score)
print("Rule Risk:", rule_risk)
print("Final Behavior Risk:", behavior_risk)
print("Reasons:", reasons)