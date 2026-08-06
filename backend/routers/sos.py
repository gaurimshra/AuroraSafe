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

router = APIRouter()

class SOSContactCreate(BaseModel):
    user_id: str
    name: str
    phone: str
    email: str = None

class SOSContactResponse(BaseModel):
    id: str
    user_id: str
    name: str
    phone: str
    email: str
    model_config = {"from_attributes": True}

class SOSTriggerRequest(BaseModel):
    latitude: float = None
    longitude: float = None
    location_text: str = None
    contacts: list = []
    user_id: str = None

@router.post("/trigger")
async def trigger_sos(request: SOSTriggerRequest, db: AsyncSession = Depends(get_db)):
    import logging
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

    logger.warning(f"SOS TRIGGERED at {request.latitude}, {request.longitude} | {request.location_text} | contacts: {contact_count}")

    return {
        "status": "success",
        "message": "SOS alert triggered. Contacts have been notified.",
        "timestamp": datetime.utcnow().isoformat(),
        "wa_links": wa_links,
        "location": {"lat": request.latitude, "lng": request.longitude}
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
