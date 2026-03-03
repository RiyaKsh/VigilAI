import numpy as np
from datetime import datetime

def extract_features(session_data):
    login_time = datetime.fromtimestamp(session_data["login_timestamp"])
    logout_time = datetime.fromtimestamp(session_data["logout_timestamp"])
    actions = session_data["actions"]

    login_hour = login_time.hour
    session_duration = (logout_time - login_time).total_seconds()

    actions_count = len(actions)

    if session_duration > 0:
        actions_per_minute = actions_count / (session_duration / 60)
    else:
        actions_per_minute = 0

    timestamps = [a["timestamp"] for a in actions]

    if len(timestamps) > 1:
        time_diffs = np.diff(timestamps)
        avg_time_between = np.mean(time_diffs)
        click_variance = np.var(time_diffs)
    else:
        avg_time_between = 0
        click_variance = 0

    unique_pages = len(set(a["page"] for a in actions))

    feature_vector = {
        "login_hour": float(login_hour),
        "session_duration": float(session_duration),
        "actions_count": float(actions_count),
        "actions_per_minute": float(actions_per_minute),
        "avg_time_between_actions": float(avg_time_between),
        "click_variance": float(click_variance),
        "unique_pages_visited": float(unique_pages)
    }

    return feature_vector
