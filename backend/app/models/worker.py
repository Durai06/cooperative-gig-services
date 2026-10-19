from sqlalchemy import Column, String, Float, Integer, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
import uuid
from app.database import Base

class Worker(Base):
    __tablename__ = "workers"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    cooperative_id = Column(String, ForeignKey("cooperatives.id"), nullable=True)
    
    experience = Column(Integer, default=1)
    rating = Column(Float, default=5.0)
    total_ratings = Column(Integer, default=0)
    availability = Column(Boolean, default=True)
    location = Column(String, nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    verification_status = Column(String, default="pending") # pending, verified, rejected
    active_jobs = Column(Integer, default=0)
    completed_jobs = Column(Integer, default=0)
    earnings = Column(Float, default=0.0)
    service_radius_km = Column(Float, default=15.0)
    emergency_available = Column(Boolean, default=False)
    
    # JSON fields for flexible structure
    schedule = Column(JSON, default=list) # [{ day: 'Monday', enabled: True, shift: '09:00-17:00' }, ...]
    skills = Column(JSON, default=list)   # [{ id: '...', serviceId: '...', serviceName: '...' }]

    # Relationships
    user = relationship("User", back_populates="worker_profile")
    cooperative = relationship("Cooperative", back_populates="workers")
    bookings = relationship("Booking", back_populates="worker")
    ratings = relationship("Rating", back_populates="worker")
