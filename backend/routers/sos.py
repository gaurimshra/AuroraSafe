from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from datetime import datetime
import json
import urllib.parse

from database import get_db
from models.sos_contact import SOSContact
from models.sos_event import SOSEvent
from models.incident import Incident
from pydantic import BaseModel
from typing import Optional, List

router = APIRouter()

class SOSContactCreate(BaseModel):
    user_id: str
    name: str
    phone: str
    email: Optional[str] = None

class SOSContactResponse(BaseModel):
    id: str
    user_id: str
    name: str
    phone: str
    email: Optional[str] = None
    model_config = {"from_attributes": True}

class SOSTriggerRequest(BaseModel):
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_text: Optional[str] = None
    contacts: list = []
    user_id: Optional[str] = None

@router.post("/trigger")
async def trigger_sos(request: SOSTriggerRequest, db: AsyncSession = Depends(get_db)):
    import logging
    import math
    import os
    logger = logging.getLogger(__name__)

    # 1. Generate WhatsApp Links
    wa_links = []
    contact_count = len(request.contacts) if request.contacts else 0
    message = f"🚨 SOS ALERT 🚨 I need immediate help. My location: {request.location_text} "
    if request.latitude and request.longitude:
        message += f"https://www.google.com/maps?q={request.latitude},{request.longitude}"

    encoded_msg = urllib.parse.quote(message)
    if request.contacts:
        for c in request.contacts:
            # simple cleanup of phone for WA
            phone = ''.join(filter(str.isdigit, c.get("phone", "")))
            if not phone.startswith("91") and len(phone) == 10:
                phone = "91" + phone
            wa_links.append(f"https://wa.me/{phone}?text={encoded_msg}")

    # 2. Log as Incident
    if request.latitude and request.longitude:
        incident = Incident(
            latitude=request.latitude,
            longitude=request.longitude,
            address=request.location_text,
            incident_type="sos_emergency",
            severity=10,
            zone="red",
            status="verified",
            source="sos",
            confidence=1.0,
            ai_summary="SOS Triggered by user",
            description="User pressed SOS button.",
            reported_by=request.user_id
        )
        db.add(incident)

    # 3. Log SOSEvent
    event = SOSEvent(
        latitude=request.latitude,
        longitude=request.longitude,
        location_text=request.location_text,
        contact_count=contact_count,
        wa_links=json.dumps(wa_links),
        user_id=request.user_id
    )
    db.add(event)
    await db.commit()

    # 4. Integrate Nearby NGOs
    nearby_ngos = []
    # Hackathon Fallback: If browser blocks location, default to Central Delhi
    lat = request.latitude if request.latitude else 28.6139
    lng = request.longitude if request.longitude else 77.2090
    
    try:
        ngo_file = os.path.join(os.path.dirname(__file__), "..", "data", "ngos.json")
        if os.path.exists(ngo_file):
            with open(ngo_file, "r") as f:
                ngos = json.load(f)
            
            def haversine(lat1, lon1, lat2, lon2):
                R = 6371.0 # km
                dlat = math.radians(lat2 - lat1)
                dlon = math.radians(lon2 - lon1)
                a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
                c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
                return R * c

            for ngo in ngos:
                dist = haversine(lat, lng, ngo["lat"], ngo["lng"])
                ngo["distance_km"] = round(dist, 1)
                
                # Generate NGO WA Link
                ngo_wa = ngo.get("whatsapp")
                if not ngo_wa and ngo.get("phones"):
                    ngo_wa = ngo["phones"][0]
                
                if ngo_wa:
                    ngo_phone = ''.join(filter(str.isdigit, ngo_wa))
                    if not ngo_phone.startswith("91") and len(ngo_phone) == 10:
                        ngo_phone = "91" + ngo_phone
                    
                    ngo_msg = f"🚨 NGO ALERT from AuroraSafe 🚨\nEmergency: SOS Activated\nLocation: https://www.google.com/maps?q={lat},{lng}\nPlease assist immediately."
                    ngo["wa_link"] = f"https://wa.me/{ngo_phone}?text={urllib.parse.quote(ngo_msg)}"
                else:
                    ngo["wa_link"] = None
            
            ngos.sort(key=lambda x: x["distance_km"])
            nearby_ngos = ngos[:3]
    except Exception as e:
        logger.error(f"Failed to process NGOs: {e}")

    logger.warning(f"SOS TRIGGERED at {request.latitude}, {request.longitude} | {request.location_text} | contacts: {contact_count}")

    return {
        "status": "success",
        "message": "SOS alert triggered. Contacts and NGOs have been identified.",
        "timestamp": datetime.utcnow().isoformat(),
        "wa_links": wa_links,
        "location": {"lat": request.latitude, "lng": request.longitude},
        "nearby_ngos": nearby_ngos
    }

@router.get("/history")
async def get_sos_history(user_id: str = None, db: AsyncSession = Depends(get_db)):
    query = select(SOSEvent).order_by(SOSEvent.created_at.desc())
    if user_id:
        query = query.where(SOSEvent.user_id == user_id)
    query = query.limit(10)
    result = await db.execute(query)
    events = result.scalars().all()
    out = []
    for e in events:
        try:
            links = json.loads(e.wa_links)
        except:
            links = []
        out.append({
            "id": e.id,
            "latitude": e.latitude,
            "longitude": e.longitude,
            "location_text": e.location_text,
            "contact_count": e.contact_count,
            "wa_links": links,
            "created_at": e.created_at.isoformat()
        })
    return out

@router.get("/contacts/{user_id}", response_model=List[SOSContactResponse])
async def get_contacts(user_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SOSContact).where(SOSContact.user_id == user_id))
    return result.scalars().all()

@router.post("/contacts", response_model=SOSContactResponse)
async def add_contact(contact: SOSContactCreate, db: AsyncSession = Depends(get_db)):
    db_contact = SOSContact(**contact.model_dump())
    db.add(db_contact)
    await db.commit()
    await db.refresh(db_contact)
    return db_contact

@router.delete("/contacts/{contact_id}")
async def delete_contact(contact_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SOSContact).where(SOSContact.id == contact_id))
    contact = result.scalars().first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    await db.delete(contact)
    await db.commit()
    return {"message": "Contact deleted"}
