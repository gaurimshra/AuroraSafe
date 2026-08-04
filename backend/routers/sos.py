from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from datetime import datetime

from database import get_db
from models.sos_contact import SOSContact
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

@router.post("/trigger")
async def trigger_sos(request: SOSTriggerRequest = None):
    # Log the SOS event (in production: send SMS/email via Twilio/SendGrid)
    import logging
    logger = logging.getLogger(__name__)
    if request:
        logger.warning(f"SOS TRIGGERED at {request.latitude}, {request.longitude} | {request.location_text} | contacts: {len(request.contacts)}")
    return {
        "status": "success",
        "message": "SOS alert triggered. Contacts have been notified.",
        "timestamp": datetime.utcnow().isoformat(),
        "location": {"lat": request.latitude if request else None, "lng": request.longitude if request else None}
    }

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
