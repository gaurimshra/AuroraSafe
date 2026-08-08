from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
import math

from database import get_db
from models.incident import Incident
from schemas.incident import IncidentCreate, IncidentResponse, VoteRequest
from ml.classifier import classify_incident
from ml.risk_model import predict_risk

router = APIRouter()

def haversine(lat1, lon1, lat2, lon2):
    R = 6371  # km
    dLat = math.radians(lat2 - lat1)
    dLon = math.radians(lon2 - lon1)
    lat1 = math.radians(lat1)
    lat2 = math.radians(lat2)
    a = math.sin(dLat/2)**2 + math.cos(lat1)*math.cos(lat2)*math.sin(dLon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    return R * c

@router.get("/", response_model=List[IncidentResponse])
async def get_incidents(
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    radius_km: Optional[float] = None,
    status: Optional[str] = None,
    user_id: Optional[str] = None,
    source: Optional[str] = None,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    query = select(Incident).order_by(Incident.created_at.desc())
    if status:
        query = query.where(Incident.status == status)
    if user_id:
        query = query.where(Incident.reported_by == user_id)
    if source:
        query = query.where(Incident.source.in_(source.split(',')))
    
    result = await db.execute(query)
    incidents = result.scalars().all()
    
    if lat is not None and lng is not None and radius_km is not None:
        filtered = []
        for inc in incidents:
            if haversine(lat, lng, inc.latitude, inc.longitude) <= radius_km:
                filtered.append(inc)
        return filtered[:limit]
        
    return incidents[:limit]

@router.post("/", response_model=IncidentResponse)
async def create_incident(inc: IncidentCreate, db: AsyncSession = Depends(get_db)):
    classification = await classify_incident(inc.description)
    risk_info = predict_risk(inc.latitude, inc.longitude)
    
    # Hard override: If the AI classifies this as a severe incident (>=7), it is a red zone.
    # Otherwise, inherit the ambient geographical risk score.
    severity = classification.get("severity", 5)
    ambient_zone = risk_info.get("zone", "yellow")
    if severity >= 8:
        final_zone = "red"
    elif severity >= 5 and ambient_zone == "green":
        final_zone = "yellow" 
    else:
        final_zone = ambient_zone
        
    db_incident = Incident(
        latitude=inc.latitude,
        longitude=inc.longitude,
        description=inc.description,
        address=inc.address,
        reported_by=inc.reported_by,
        incident_type=classification.get("incident_type", "other"),
        severity=severity,
        threat_category=classification.get("threat_category", "other"),
        confidence=classification.get("confidence", 0.5),
        ai_summary=classification.get("summary", ""),
        risk_score=risk_info.get("score", 0.5),
        zone=final_zone,
        status="pending"
    )
    db.add(db_incident)
    await db.commit()
    await db.refresh(db_incident)
    return db_incident

@router.get("/{id}", response_model=IncidentResponse)
async def get_incident(id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Incident).where(Incident.id == id))
    incident = result.scalars().first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return incident

@router.put("/{id}/vote")
async def vote_incident(id: str, vote_req: VoteRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Incident).where(Incident.id == id))
    incident = result.scalars().first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    if vote_req.vote == "up":
        incident.upvotes += 1
    elif vote_req.vote == "down":
        incident.downvotes += 1
    else:
        raise HTTPException(status_code=400, detail="Invalid vote")
        
    await db.commit()
    return {"message": "Vote recorded"}
