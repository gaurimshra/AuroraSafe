import uuid
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column
from database import Base

class SOSContact(Base):
    __tablename__ = "sos_contacts"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    phone: Mapped[str] = mapped_column(String(20), nullable=True)
    email: Mapped[str] = mapped_column(String(100), nullable=True)
