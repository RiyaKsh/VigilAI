def evaluate_behavior_rules(features, baseline):

    rule_risk = 0
    reasons = []

    # ---------- 1️⃣ Login Time Deviation ----------
    login_deviation = abs(features["login_hour"] - baseline["avg_login_hour"])
    threshold = 3  # hours

    if login_deviation > threshold:
        severity = min(login_deviation / threshold, 5)
        risk = 10 * severity
        rule_risk += risk
        reasons.append(f"Login time deviated by {login_deviation} hours")

    # ---------- 2️⃣ Action Burst ----------
    action_threshold = baseline["avg_actions_per_minute"] + (
        3 * baseline["std_actions_per_minute"]
    )

    if features["actions_per_minute"] > action_threshold:
        deviation = features["actions_per_minute"] - action_threshold
        severity = min(deviation / action_threshold, 5)
        risk = 15 * severity
        rule_risk += risk
        reasons.append("High action rate detected")

    # ---------- 3️⃣ Short Session ----------
    if features["session_duration"] < baseline["avg_session_duration"] * 0.3:
        severity = (
            baseline["avg_session_duration"] - features["session_duration"]
        ) / baseline["avg_session_duration"]
        severity = min(severity, 3)
        risk = 8 * severity
        rule_risk += risk
        reasons.append("Abnormally short session")

    # ---------- 4️⃣ Page Exploration ----------
    if features["unique_pages_visited"] > baseline["avg_unique_pages"] * 2:
        deviation = (
            features["unique_pages_visited"] - baseline["avg_unique_pages"]
        )
        severity = min(deviation / baseline["avg_unique_pages"], 4)
        risk = 12 * severity
        rule_risk += risk
        reasons.append("Unusual page exploration")

    # Cap final risk
    rule_risk = min(rule_risk, 100)

    return float(rule_risk), reasons