from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
from threat_engine import analyze_session

app = FastAPI()

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
    result = analyze_session(logs)
    return result
