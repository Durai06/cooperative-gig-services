from sqlalchemy import Column, String, Float, Integer, Boolean, ForeignKey, DateTime
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
    
    # Financial snapshot (mandatory booking charge + service fee)
    service_fee = Column(Float, nullable=True)                 # Base service price snapshot in INR
    booking_charge = Column(Float, nullable=True, default=100.0) # Mandatory booking service charge in INR
    total_amount = Column(Float, nullable=True)               # Total payable (service_fee + booking_charge)
    service_fee_paise = Column(Integer, nullable=True)         # In integer paise (1 INR = 100 paise)
    booking_charge_paise = Column(Integer, nullable=True, default=10000) # 10000 paise (₹100)
    total_amount_paise = Column(Integer, nullable=True)       # Total in integer paise
    payment_method = Column(String, nullable=True, default="cash") # "cash", "direct_upi"
    payment_status = Column(String, nullable=True, default="pending") # "pending", "paid", "refunded"

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
