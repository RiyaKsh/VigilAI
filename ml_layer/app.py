from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
import numpy as np

from feature_extractor import extract_features
from model import BehaviorModel
from behavior_rules import evaluate_behavior_rules
from risk_memory import update_risk_memory
from adaptive_learning import update_baseline
from threat_engine import analyze_session


app = FastAPI()
SAFE_THRESHOLD = 40

# ----------------------------
# Memory stores (temporary)
# ----------------------------
user_models = {}
user_baselines = {}
user_histories = {}

# ----------------------------
# Request schema
# ----------------------------
class Action(BaseModel):
    page: str
    timestamp: int

class Session(BaseModel):
    user_id: str
    session_id: str
    login_timestamp: int
    logout_timestamp: int
    actions: List[Action]

# ----------------------------
# Feature dict → vector
# ----------------------------

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

# ----------------------------
# Dummy baseline creator
# ----------------------------
def create_default_baseline():
    return {
        "feature_history": [],
        "avg_login_hour": 21,
        "std_login_hour": 1,
        "avg_actions_per_minute": 3,
        "std_actions_per_minute": 0.5,
        "avg_session_duration": 600,
        "std_session_duration": 50,
        "avg_unique_pages": 4
    }

# ----------------------------
# API endpoint
# ----------------------------
@app.post("/evaluate-session")
def evaluate_session(session: Session):
    user_id = session.user_id
    # convert to dict
    session_data = session.dict()
    # ----------------------------
    # Load or create model
    # ----------------------------

    if user_id not in user_models:
        model = BehaviorModel()
        user_models[user_id] = model
        user_baselines[user_id] = create_default_baseline()
        user_histories[user_id] = {
            "last_10_behavior_risks": []
        }

    model = user_models[user_id]
    baseline = user_baselines[user_id]
    history = user_histories[user_id]

    # ----------------------------
    # Feature extraction
    # ----------------------------
    features = extract_features(session_data)
    feature_vector = feature_dict_to_vector(features)
    trust_score = model.predict(feature_vector)
    trust_risk = 100 - trust_score

    # ----------------------------
    # Rule engine
    # ----------------------------

    rule_risk, reasons = evaluate_behavior_rules(features, baseline)
    behavior_risk = (0.6 * trust_risk) + (0.4 * rule_risk)

    # ----------------------------
    # Risk memory
    # ----------------------------

    memory_result = update_risk_memory(history, behavior_risk)
    history["last_10_behavior_risks"] = memory_result["last_10_behavior_risks"]
    drift_flag = memory_result["drift_flag"]
    if drift_flag:
        behavior_risk = min(behavior_risk + 10, 100)

    # ----------------------------
    # Adaptive learning
    # ----------------------------

    if behavior_risk < SAFE_THRESHOLD and not drift_flag:
        baseline = update_baseline(baseline, feature_vector)
        user_baselines[user_id] = baseline

    is_safe = behavior_risk < SAFE_THRESHOLD

    return {
        "trust_score": trust_score,
        "rule_risk": rule_risk,
        "behavior_risk": behavior_risk,
        "drift_flag": drift_flag,
        "is_safe": is_safe,
        "reasons": reasons
    }

# Define input structure
class LogItem(BaseModel):
    event: str
    timestamp: int
    user_id: str

class ThreatRequest(BaseModel):
    logs: List[LogItem]

@app.post("/evaluate-threat")
async def evaluate(request: ThreatRequest):
    
    logs = [log.dict() for log in request.logs]
    print("Incoming logs:", logs)
    result = analyze_session(logs)
    return result
