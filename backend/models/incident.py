import uuid
from datetime import datetime
from sqlalchemy import String, Float, Integer, DateTime, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from typing import Optional
from database import Base

class Incident(Base):
    __tablename__ = "incidents"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    incident_type: Mapped[str] = mapped_column(String(50), default="other")  # theft, assault, harassment, suspicious_activity, vandalism, accident, other
    severity: Mapped[int] = mapped_column(Integer, default=5)  # 1-10
    threat_category: Mapped[str] = mapped_column(String(50), default="other")  # violent_crime, property_crime, public_safety, harassment, other
    confidence: Mapped[float] = mapped_column(Float, default=0.5)  # AI confidence 0-1
    risk_score: Mapped[float] = mapped_column(Float, default=0.5)  # 0-1
    zone: Mapped[str] = mapped_column(String(10), default="yellow")  # green, yellow, red
    status: Mapped[str] = mapped_column(String(20), default="pending")  # pending, verified, rejected
    upvotes: Mapped[int] = mapped_column(Integer, default=0)
    downvotes: Mapped[int] = mapped_column(Integer, default=0)
    reported_by: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    address: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    ai_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    # Data provenance
    source: Mapped[str] = mapped_column(String(30), default="user_report")  # user_report, newsapi, gnews, seed_data
    news_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)    # Original article URL
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)  # Auto-expiry for news incidents
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
