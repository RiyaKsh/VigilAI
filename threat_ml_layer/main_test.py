import threat_engine

threat_engine.correlation_memory.clear()
threat_engine.risk_history.clear()
logs_normal = [   
    {"event": "login_success", "timestamp": 10, "user_id": "U1"},
    {"event": "api_call", "timestamp": 20, "user_id": "U1"},
    {"event": "download", "timestamp": 40, "user_id": "U1"},
    {"event": "api_call", "timestamp": 70, "user_id": "U1"},
]
print(threat_engine.analyze_session(logs_normal))