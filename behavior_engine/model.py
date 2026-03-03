from sklearn.ensemble import IsolationForest
import numpy as np

class BehaviorModel:

    def __init__(self):
        self.model = IsolationForest(
            n_estimators=100,
            contamination=0.1,
            random_state=42
        )

    def train(self, feature_list):
        """
        feature_list: list of lists
        Each inner list = one session feature vector
        """
        X = np.array(feature_list)
        self.model.fit(X)

    def predict(self, feature_vector):
        """
        feature_vector: list of numeric values
        """
        X = np.array([feature_vector])

        anomaly_score = self.model.decision_function(X)[0]
        # Higher = more normal

        # Normalize roughly to 0–100
        trust_score = max(0, min(100, (anomaly_score + 0.5) * 100))

        return float(trust_score)