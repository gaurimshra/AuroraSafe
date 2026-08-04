from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class IncidentCreate(BaseModel):
    latitude: float
    longitude: float
    description: str
    address: Optional[str] = None

class IncidentResponse(BaseModel):
    id: str
    latitude: float
    longitude: float
    description: str
    incident_type: str
    severity: int
    threat_category: str
    confidence: float
    risk_score: float
    zone: str
    status: str
    upvotes: int
    downvotes: int
    address: Optional[str]
    ai_summary: Optional[str]
    created_at: datetime
    model_config = {"from_attributes": True}

class VoteRequest(BaseModel):
    vote: str  # "up" or "down"
