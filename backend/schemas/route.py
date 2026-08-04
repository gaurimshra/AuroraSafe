from pydantic import BaseModel
from typing import List

class Location(BaseModel):
    lat: float
    lng: float

class RouteRequest(BaseModel):
    origin: Location
    destination: Location

class RouteResponse(BaseModel):
    waypoints: List[Location]
    distance_km: float
    estimated_time_min: int
    safety_score: float
    avoided_zones: int
    route_type: str  # "safest", "balanced"
