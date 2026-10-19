from sqlalchemy import Column, String, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.database import Base

class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    booking_id = Column(String, ForeignKey("bookings.id"), nullable=False)
    customer_id = Column(String, ForeignKey("users.id"), nullable=False)
    
    category = Column(String, nullable=False) # worker_no_show, poor_service, overcharging, behaviour_issue, other
    description = Column(String, nullable=False)
    photos = Column(JSON, default=list)
    status = Column(String, default="open") # open, under_review, resolved
    resolution_note = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    booking = relationship("Booking", back_populates="complaints")
    customer = relationship("User", back_populates="complaints_filed")
