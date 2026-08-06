from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from database import Base
import uuid

class SOSEvent(Base):
    __tablename__ = "sos_events"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    latitude: Mapped[float] = mapped_column(Float, nullable=True)
    longitude: Mapped[float] = mapped_column(Float, nullable=True)
    location_text: Mapped[str] = mapped_column(String, nullable=True)
    contact_count: Mapped[int] = mapped_column(Integer, default=0)
    user_id: Mapped[str] = mapped_column(String, nullable=True)
    wa_links: Mapped[str] = mapped_column(String, default="[]") # JSON string array
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
