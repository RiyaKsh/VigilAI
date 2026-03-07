import numpy as np
from sklearn.ensemble import IsolationForest


class BehaviorModel:

    def __init__(self):
        self.model = IsolationForest(
            n_estimators=100,
            contamination=0.1,
            random_state=42
        )

        # fallback baseline (used before user-specific training)
        baseline_data = np.array([
            [21, 600, 5, 3.0, 10, 1, 4],
            [20, 650, 6, 3.1, 11, 1, 5],
            [22, 620, 5, 2.9, 9, 1, 4],
            [21, 610, 4, 3.2, 10, 1, 4],
            [20, 590, 6, 3.0, 12, 1, 5]
        ])

        self.model.fit(baseline_data)

    def train(self, feature_history):

        X = np.array(feature_history)

        self.model = IsolationForest(
            n_estimators=100,
            contamination=0.1,
            random_state=42
        )

        self.model.fit(X)

    def predict(self, feature_vector):

        X = np.array([feature_vector])

        anomaly_score = self.model.decision_function(X)[0]

        trust_score = max(0, min(100, (anomaly_score + 0.5) * 100))

        return float(trust_score)