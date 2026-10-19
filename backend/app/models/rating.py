from sqlalchemy import Column, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.database import Base

class Rating(Base):
    __tablename__ = "ratings"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    booking_id = Column(String, ForeignKey("bookings.id"), unique=True, nullable=False)
    customer_id = Column(String, ForeignKey("users.id"), nullable=False)
    worker_id = Column(String, ForeignKey("workers.id"), nullable=False)
    
    overall = Column(Float, nullable=False)
    work_quality = Column(Float, nullable=False)
    punctuality = Column(Float, nullable=False)
    behaviour = Column(Float, nullable=False)
    professionalism = Column(Float, nullable=False)
    review = Column(String, default="")
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    booking = relationship("Booking", back_populates="rating")
    customer = relationship("User", back_populates="ratings_given")
    worker = relationship("Worker", back_populates="ratings")
