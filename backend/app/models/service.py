from sqlalchemy import Column, String, Float
from sqlalchemy.orm import relationship
import uuid
from app.database import Base

class Service(Base):
    __tablename__ = "services"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    description = Column(String, nullable=False)
    base_price = Column(Float, nullable=False)
    icon = Column(String, nullable=False)
    category = Column(String, nullable=False)

    bookings = relationship("Booking", back_populates="service")
