import numpy as np

def update_baseline(baseline, new_feature_vector, window_size=20):

    history = baseline.get("feature_history", [])

    history.append(new_feature_vector)

    if len(history) > window_size:
        history.pop(0)

    X = np.array(history)

    updated_baseline = {
        "feature_history": history,

        "avg_login_hour": float(np.mean(X[:, 0])),
        "std_login_hour": float(np.std(X[:, 0])),

        "avg_session_duration": float(np.mean(X[:, 1])),
        "std_session_duration": float(np.std(X[:, 1])),

        "avg_actions_per_minute": float(np.mean(X[:, 3])),
        "std_actions_per_minute": float(np.std(X[:, 3])),

        "avg_unique_pages": float(np.mean(X[:, 6]))
    }

    return updated_baseline