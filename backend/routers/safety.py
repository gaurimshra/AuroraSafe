from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional

from database import get_db
from models.incident import Incident
from schemas.safety import HeatmapPoint, RiskScoreResponse, HotspotZone
from schemas.incident import IncidentResponse
from ml.risk_model import predict_risk
from ml.hotspot import detect_hotspots
from routers.incidents import haversine

router = APIRouter()

@router.get("/heatmap", response_model=List[HeatmapPoint])
async def get_heatmap(db: AsyncSession = Depends(get_db)):
    query = select(Incident).where(Incident.status.in_(["verified", "pending"]))
    result = await db.execute(query)
    incidents = result.scalars().all()
    
    points = []
    for inc in incidents:
        weight = min(1.0, inc.risk_score * (inc.severity / 10.0) * 2)
        points.append(HeatmapPoint(lat=inc.latitude, lng=inc.longitude, weight=weight))
    return points

@router.get("/risk-score", response_model=RiskScoreResponse)
async def get_risk_score(lat: float, lng: float, db: AsyncSession = Depends(get_db)):
    risk_info = predict_risk(lat, lng)
    
    query = select(Incident).where(Incident.status.in_(["verified", "pending"]))
    result = await db.execute(query)
    incidents = result.scalars().all()
    
    nearby_count = sum(1 for inc in incidents if haversine(lat, lng, inc.latitude, inc.longitude) <= 1.0)
    
    return RiskScoreResponse(
        score=risk_info["score"],
        confidence=risk_info["confidence"],
        zone=risk_info["zone"],
        nearby_incidents=nearby_count,
        message=risk_info["message"]
    )

@router.get("/zones", response_model=List[HotspotZone])
async def get_zones(db: AsyncSession = Depends(get_db)):
    query = select(Incident).where(Incident.status.in_(["verified", "pending"]))
    result = await db.execute(query)
    incidents = result.scalars().all()
    
    incident_dicts = [{
        "latitude": inc.latitude,
        "longitude": inc.longitude,
        "risk_score": inc.risk_score,
        "severity": inc.severity,
        "incident_type": inc.incident_type
    } for inc in incidents]
    
    hotspots = detect_hotspots(incident_dicts)
    return [HotspotZone(**h) for h in hotspots]

@router.get("/nearby-alerts", response_model=List[IncidentResponse])
async def get_nearby_alerts(lat: float, lng: float, radius_km: float = 1.0, db: AsyncSession = Depends(get_db)):
    query = select(Incident).where(Incident.status.in_(["verified", "pending"]))
    result = await db.execute(query)
    incidents = result.scalars().all()
    
    alerts = []
    for inc in incidents:
        if inc.zone in ["red", "yellow"]:
            if haversine(lat, lng, inc.latitude, inc.longitude) <= radius_km:
                alerts.append(inc)
    return alerts
