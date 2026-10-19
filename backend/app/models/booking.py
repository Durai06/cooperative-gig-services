from sqlalchemy import Column, String, Float, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.database import Base

class Booking(Base):
    __tablename__ = "bookings"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    customer_id = Column(String, ForeignKey("users.id"), nullable=False)
    worker_id = Column(String, ForeignKey("workers.id"), nullable=True)
    service_id = Column(String, ForeignKey("services.id"), nullable=False)
    
    description = Column(String, nullable=False)
    location = Column(String, nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    preferred_date = Column(String, nullable=False)
    preferred_time = Column(String, nullable=False)
    emergency = Column(Boolean, default=False)
    status = Column(String, default="pending") # pending, worker_assigned, accepted, in_progress, completed, cancelled
    notes = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    customer = relationship("User", foreign_keys=[customer_id], back_populates="customer_bookings")
    worker = relationship("Worker", back_populates="bookings")
    service = relationship("Service", back_populates="bookings")
    rating = relationship("Rating", back_populates="booking", uselist=False)
    complaints = relationship("Complaint", back_populates="booking")
