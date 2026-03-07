from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
import numpy as np
from pymongo import MongoClient
import os
from dotenv import load_dotenv
import joblib
from pathlib import Path
from datetime import datetime, timezone

from feature_extractor import extract_features
from model import BehaviorModel
from behavior_rules import evaluate_behavior_rules
from risk_memory import update_risk_memory
from adaptive_learning import update_baseline
from threat_engine import analyze_session

# ----------------------------
# MongoDB Connection
# ----------------------------
load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
client = MongoClient(MONGO_URI)
db = client["VigilAI_DB"]

user_sessions_collection = db["usersessions"]
user_profiles_collection = db["userprofiles"]

MODEL_DIR = Path("models")
MODEL_DIR.mkdir(exist_ok=True)
model_cache = {}

app = FastAPI()
SAFE_THRESHOLD = 40
fallback_model = BehaviorModel()
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

#Getting the model path for individual user
def get_model_path(user_id):
    return MODEL_DIR / f"user_{user_id}.pkl"

#Load User Model Function
def load_user_model(user_id):
    if user_id in model_cache:
        return model_cache[user_id]
    model_path = get_model_path(user_id)
    if model_path.exists():
        model = joblib.load(model_path)
        model_cache[user_id] = model
        return model
    return None

#Save Model Function
def save_user_model(user_id, model):
    model_path = get_model_path(user_id)
    joblib.dump(model, model_path)

#Training Function for individual users
def train_user_model(user_id, feature_history):
    if len(feature_history) < 5:
        return None
    model = BehaviorModel()
    model.train(feature_history)
    save_user_model(user_id, model)
    return model

#checking if the user already has a baseline.
def load_user_profile(user_id):
    profile = user_profiles_collection.find_one({"user_id": user_id})
    return profile

#If a user does not yet have a profile, creating one.
def create_default_user_profile(user_id):
    profile = {
        "user_id": user_id,
        "baseline": {
            "feature_history": [],
            **create_default_baseline()
        },
        "risk_memory": {
            "last_10_behavior_risks": []
        },
        "model_metadata": {
            "safe_session_count": 0,
            "last_trained_at": None
        }
    }
    user_profiles_collection.insert_one(profile)
    return profile

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
        "avg_login_hour": None,
        "std_login_hour": None,
        "avg_actions_per_minute": None,
        "std_actions_per_minute": None,
        "avg_session_duration": None,
        "std_session_duration": None,
        "avg_unique_pages": None
    }

#bootstrap function for default baselines
def bootstrap_baseline_from_session(features, feature_vector):
    return {
        "feature_history": [feature_vector],

        "avg_login_hour": float(features["login_hour"]),
        "std_login_hour": 0.0,

        "avg_session_duration": float(features["session_duration"]),
        "std_session_duration": 0.0,

        "avg_actions_per_minute": float(features["actions_per_minute"]),
        "std_actions_per_minute": 0.0,

        "avg_unique_pages": float(features["unique_pages_visited"])
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

    profile = load_user_profile(user_id)
    if profile is None:
        profile = create_default_user_profile(user_id)
    baseline = profile.get("baseline", create_default_baseline())
    history = profile.get("risk_memory", {"last_10_behavior_risks": []})
    # ----------------------------
    # Feature extraction
    # ----------------------------

    features = extract_features(session_data)
    feature_vector = feature_dict_to_vector(features)
    # Feature extraction
    feature_history = baseline.get("feature_history", [])
    if len(feature_history) < 3:
        rule_risk = 0
        reasons = []
    else:
        rule_risk, reasons = evaluate_behavior_rules(features, baseline)

    if len(feature_history) == 0:
        baseline = bootstrap_baseline_from_session(features, feature_vector)

        user_profiles_collection.update_one(
            {"user_id": user_id},
            {
                "$set": {
                    "baseline": baseline
                }
            }
        )
        # Load user model if exists
    user_model = load_user_model(user_id)
    if user_model:
        trust_score = user_model.predict(feature_vector)
    else:
        trust_score = fallback_model.predict(feature_vector)

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
    user_profiles_collection.update_one(
        {"user_id": user_id},
        {
            "$set": {
                "risk_memory.last_10_behavior_risks": memory_result["last_10_behavior_risks"]
            }
        }
    )
    drift_flag = memory_result["drift_flag"]
    if drift_flag:
        behavior_risk = min(behavior_risk + 10, 100)

    # ----------------------------
    # Adaptive learning
    # ----------------------------
    # determine safety
    is_safe = behavior_risk < SAFE_THRESHOLD

    # increment safe session counter
    if is_safe:
        profile["model_metadata"]["safe_session_count"] += 1

    # update baseline only for safe sessions without drift
    if behavior_risk < SAFE_THRESHOLD and not drift_flag:
        baseline = update_baseline(baseline, feature_vector)
        user_profiles_collection.update_one(
            {"user_id": user_id},
            {
                "$set": {
                    "baseline": baseline,
                    "model_metadata.safe_session_count": profile["model_metadata"]["safe_session_count"]
                }
            }
        )
    else:
        # still update the safe_session_count if session was safe
        user_profiles_collection.update_one(
            {"user_id": user_id},
            {
                "$set": {
                    "model_metadata.safe_session_count": profile["model_metadata"]["safe_session_count"]
                }
            }
        )

    feature_history = baseline.get("feature_history", [])
    safe_count = profile["model_metadata"]["safe_session_count"]

    # train first model
    if safe_count >= 5 and profile["model_metadata"]["last_trained_at"] is None:

        trained_model = train_user_model(user_id, feature_history)
        if trained_model:
            model_cache[user_id] = trained_model
        if trained_model:
            user_profiles_collection.update_one(
                {"user_id": user_id},
                {
                    "$set": {
                        "model_metadata.last_trained_at": datetime.now(timezone.utc)
                    }
                }
            )
    elif safe_count % 5 == 0 and safe_count >= 10 and is_safe:

        trained_model = train_user_model(user_id, feature_history)
        if trained_model:
            model_cache[user_id] = trained_model
        if trained_model:
            user_profiles_collection.update_one(
                {"user_id": user_id},
                {
                    "$set": {
                        "model_metadata.last_trained_at": datetime.now(timezone.utc)
                    }
                }
            )
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
