from pydantic import BaseModel
from typing import List, Optional

class HeatmapPoint(BaseModel):
    lat: float
    lng: float
    weight: float

class RiskScoreResponse(BaseModel):
    score: float
    confidence: float
    zone: str  # green, yellow, red
    nearby_incidents: int
    message: str

class HotspotZone(BaseModel):
    lat: float
    lng: float
    radius: float
    risk_level: str
    incident_count: int
    dominant_type: str
    avg_severity: Optional[float] = None
    avg_risk_score: Optional[float] = None
