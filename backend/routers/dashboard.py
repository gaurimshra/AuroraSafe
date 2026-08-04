from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, timedelta

from database import get_db
from models.incident import Incident
from ml.hotspot import detect_hotspots

router = APIRouter()

@router.get("/stats")
async def get_stats(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Incident))
    incidents = result.scalars().all()
    
    total = len(incidents)
    high_risk = sum(1 for i in incidents if i.zone == "red")
    verified = sum(1 for i in incidents if i.status == "verified")
    pending = sum(1 for i in incidents if i.status == "pending")
    total_upvotes = sum(i.upvotes for i in incidents)
    
    return {
        "total_incidents": total,
        "high_risk_zones": high_risk,
        "verified_incidents": verified,
        "pending_incidents": pending,
        "total_upvotes": total_upvotes,
        "categories_count": len(set(i.incident_type for i in incidents))
    }

@router.get("/trends")
async def get_trends(db: AsyncSession = Depends(get_db)):
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    query = select(Incident).where(Incident.created_at >= thirty_days_ago)
    result = await db.execute(query)
    incidents = result.scalars().all()
    
    trends_dict = {}
    for inc in incidents:
        date_str = inc.created_at.date().isoformat()
        if date_str not in trends_dict:
            trends_dict[date_str] = {"date": date_str, "count": 0, "high_risk": 0}
        trends_dict[date_str]["count"] += 1
        if inc.zone == "red":
            trends_dict[date_str]["high_risk"] += 1
            
    trends_list = list(trends_dict.values())
    trends_list.sort(key=lambda x: x["date"])
    return trends_list

@router.get("/categories")
async def get_categories(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Incident.incident_type, func.count(Incident.id)).group_by(Incident.incident_type))
    categories = result.all()
    
    total = sum(count for _, count in categories)
    if total == 0:
        return []
        
    return [
        {"name": name, "count": count, "percentage": round((count / total) * 100, 2)}
        for name, count in categories
    ]

@router.get("/heatmap-zones")
async def get_heatmap_zones(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Incident))
    incidents = result.scalars().all()
    
    incident_dicts = [{
        "latitude": inc.latitude,
        "longitude": inc.longitude,
        "risk_score": inc.risk_score,
        "severity": inc.severity,
        "incident_type": inc.incident_type
    } for inc in incidents]
    
    hotspots = detect_hotspots(incident_dicts)
    return hotspots[:5]  # Top 5
