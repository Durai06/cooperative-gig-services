from sqlalchemy import Column, String, DateTime, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    phone = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False, default="customer") # customer, worker, admin
    avatar_url = Column(String, nullable=True)
    address = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    worker_profile = relationship("Worker", back_populates="user", uselist=False, cascade="all, delete-orphan")
    customer_bookings = relationship("Booking", foreign_keys="[Booking.customer_id]", back_populates="customer")
    ratings_given = relationship("Rating", back_populates="customer")
    complaints_filed = relationship("Complaint", back_populates="customer")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
