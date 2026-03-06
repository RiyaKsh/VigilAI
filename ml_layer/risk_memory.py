def update_risk_memory(user_history, current_risk, window_size=10):

    risks = user_history.get("last_10_behavior_risks", [])

    risks.append(current_risk)

    if len(risks) > window_size:
        risks.pop(0)

    drift_flag = detect_progressive_drift(risks)

    return {
        "last_10_behavior_risks": risks,
        "drift_flag": drift_flag
    }


def detect_progressive_drift(risks):

    if len(risks) < 4:
        return False

    # Check last 3 values increasing
    return risks[-3] < risks[-2] < risks[-1]