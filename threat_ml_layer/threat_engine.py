from random import random
import numpy as np
from sklearn.ensemble import IsolationForest
import joblib
import os

# ---- SYSTEM THRESHOLDS ----

SUSTAINED_THRESHOLD = 45
SUSTAINED_MIN_COUNT = 7
SUSTAINED_ESCALATION_MULTIPLIER = 30

CORRELATION_USER_THRESHOLD = 15
CORRELATION_DOWNLOAD_THRESHOLD = 20
CORRELATION_BONUS = 25

risk_history = []
correlation_memory = []
CORRELATION_WINDOW = 600  # 10 minutes
# -------------------------
# 1️⃣ Log Aggregation
# -------------------------
baseline = {
    "request_rate_mean": 10.0,
    "alpha": 0.1  # learning rate
}

def aggregate_threat_features(logs):
    features = {
        "failed_login_count": 0,
        "request_rate": 0,
        "download_frequency": 0,
        "privilege_change_events": 0,
        "unique_users_active": set()
    }
    current_time = logs[-1]["timestamp"] if logs else 0

    for log in logs:
        features["request_rate"] += 1

        if log["event"] == "login_failed":
            features["failed_login_count"] += 1

        elif log["event"] == "download":
            features["download_frequency"] += 1
            correlation_memory.append({
            "user_id": log["user_id"],
            "timestamp": log["timestamp"]
            })

        elif log["event"] == "privilege_change":
            features["privilege_change_events"] += 1

        if "user_id" in log:
            features["unique_users_active"].add(log["user_id"])

        correlation_memory[:] = [
            event for event in correlation_memory
            if current_time - event["timestamp"] <= CORRELATION_WINDOW
        ]

    features["unique_users_active"] = len(features["unique_users_active"])

    return features


# -------------------------
# 2️⃣ Rule Engine
# -------------------------
def rule_engine(threat_data):
    rules_triggered = []
    risk_score = 0

    if threat_data["failed_login_count"] >= 5:
        rules_triggered.append("Brute force attempt detected")
        risk_score = max(risk_score, 90)

    if threat_data["download_frequency"] >= 3:
        rules_triggered.append("Mass download burst detected")
        risk_score = max(risk_score, 80)

    if threat_data["request_rate"] > 60:
        rules_triggered.append("Traffic spike detected")
        risk_score = max(risk_score, 75)

    if threat_data["privilege_change_events"] >= 1:
        rules_triggered.append("Suspicious privilege modification detected")
        risk_score = max(risk_score, 85)

    return risk_score, rules_triggered

def apply_rule_layer(threat_data):
    return rule_engine(threat_data)

# -------------------------
# 3️⃣ ML Model Training
# -------------------------
def train_threat_model(model_path="threat_model.pkl"):
    if os.path.exists(model_path):
        # print("Loading existing model...")
        return joblib.load(model_path)

    # print("Training new model...")
    import random

    def generate_normal_window():
        # 70% low activity
        if random.random() < 0.7:
            request_rate = random.randint(1, 6)
            download_frequency = random.randint(0, 1)
            unique_users = random.randint(1, 3)
        else:
            request_rate = random.randint(7, 20)
            download_frequency = random.randint(0, 3)
            unique_users = random.randint(3, 8)
        if random.random() < 0.8:
            failed_logins = random.randint(0, 2)
        else:
            failed_logins = random.randint(3, 4)
        return [
            failed_logins,
            request_rate,
            download_frequency,
            random.randint(0, 1),      # privilege_change_events
            unique_users
        ]

    training_data = [generate_normal_window() for _ in range(1000)]

    model = IsolationForest(contamination=0.08)
    model.fit(training_data)
    scores = model.decision_function(training_data)
    model.min_score = min(scores)
    model.max_score = max(scores)
    joblib.dump(model, model_path)
    return model


# -------------------------
# 4️⃣ ML Threat Score
# -------------------------
def get_ml_threat_score(threat_data, model):
    vector = np.array([[
        threat_data["failed_login_count"],
        threat_data["request_rate"],
        threat_data["download_frequency"],
        threat_data["privilege_change_events"],
        threat_data["unique_users_active"]
    ]])

    score = model.decision_function(vector)[0]

    # Normalize based on training score range
    normalized = (score - model.min_score) / (model.max_score - model.min_score)

    # Invert because lower score = more anomalous
    threat_score = (1 - normalized) * 100

    # Clamp
    threat_score = max(0, min(100, threat_score))
    # Baseline deviation adjustment
    rate = threat_data["request_rate"]
    baseline_mean = baseline["request_rate_mean"]

    deviation = abs(rate - baseline_mean)

    if deviation > baseline_mean * 0.5:
        threat_score += 15

    threat_score = max(0, min(100, threat_score))


    return threat_score
def apply_ml_layer(threat_data, model):
    return get_ml_threat_score(threat_data, model)

# -------------------------
# 5️⃣ Hybrid Evaluation
# -------------------------
def evaluate_threat_over_time(logs, model):
    windows = split_into_time_windows(logs)
    results = []

    for window in windows:
        result = evaluate_threat(window, model)
        results.append(result)

    return results

def apply_sustained_escalation(final_risk):
    if len(risk_history) == 10:
        high_count = sum(1 for r in risk_history if r > SUSTAINED_THRESHOLD)
        high_ratio = high_count / 10

        if high_count >= SUSTAINED_MIN_COUNT:
            escalation_bonus = high_ratio * SUSTAINED_ESCALATION_MULTIPLIER
            final_risk = min(100, final_risk + escalation_bonus)

    return final_risk

def apply_correlation_detection(final_risk, rule_risk):
    distinct_users = set(event["user_id"] for event in correlation_memory)
    total_downloads = len(correlation_memory)

    if rule_risk < 50:
        if len(distinct_users) >= CORRELATION_USER_THRESHOLD  and total_downloads >= CORRELATION_DOWNLOAD_THRESHOLD:
            final_risk = min(100, final_risk + CORRELATION_BONUS)

    return final_risk
def fuse_risk(rule_risk, ml_risk):
    if rule_risk >= 80:
        return rule_risk
    else:
        return 0.6 * ml_risk + 0.4 * rule_risk
def evaluate_threat(logs, model):
    threat_data = aggregate_threat_features(logs)

    rule_risk, reasons =apply_rule_layer(threat_data)
    ml_risk =apply_ml_layer(threat_data, model)

    final_risk = fuse_risk(rule_risk, ml_risk)

    final_risk = apply_sustained_escalation(final_risk)

    final_risk = apply_correlation_detection(final_risk, rule_risk)

    risk_history.append(final_risk)

    if len(risk_history) > 10:
        risk_history.pop(0)

    

    update_baseline(threat_data, final_risk)
    decision = decision_engine(final_risk)
    return {
        "final_threat_score": float(round(final_risk, 2)),
        "ml_risk": float(round(ml_risk, 2)),
        "rule_risk": int(rule_risk),
        "decision": decision,
        "reasons": reasons
    }

def split_into_time_windows(logs, window_size=60):
    if not logs:
        return []

    logs = sorted(logs, key=lambda x: x["timestamp"])
    windows = []
    current_window = []
    start_time = logs[0]["timestamp"]

    for log in logs:
        if log["timestamp"] - start_time < window_size:
            current_window.append(log)
        else:
            windows.append(current_window)
            current_window = [log]
            start_time = log["timestamp"]

    if current_window:
        windows.append(current_window)

    return windows

def update_baseline(threat_data, final_risk):
    # Only update if system considered safe
    if final_risk < 30:
        current_rate = threat_data["request_rate"]

        old_mean = baseline["request_rate_mean"]
        alpha = baseline["alpha"]

        new_mean = (1 - alpha) * old_mean + alpha * current_rate
        max_allowed = old_mean * 1.2

        baseline["request_rate_mean"] = min(new_mean, max_allowed)

        # print("Updated baseline:", baseline["request_rate_mean"])


def decision_engine(final_risk):
    if final_risk < 30:
        return "allow"
    elif final_risk < 60:
        return "monitor"
    elif final_risk < 80:
        return "restrict"
    else:
        return "block"
    

model_instance = None

def analyze_session(logs):
    global model_instance

    if model_instance is None:
        model_instance = train_threat_model()

    results = evaluate_threat_over_time(logs, model_instance)

    return results[-1]  # Return the most recent window's evaluation