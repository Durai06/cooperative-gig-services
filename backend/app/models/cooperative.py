from sqlalchemy import Column, String
from sqlalchemy.orm import relationship
import uuid
from app.database import Base

class Cooperative(Base):
    __tablename__ = "cooperatives"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    location = Column(String, nullable=False)
    contact = Column(String, nullable=False)

    workers = relationship("Worker", back_populates="cooperative")
