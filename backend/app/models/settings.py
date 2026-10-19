from sqlalchemy import Column, Integer, Float
from app.database import Base

class CooperativeSettings(Base):
    __tablename__ = "cooperative_settings"

    id = Column(Integer, primary_key=True, default=1)
    commission_rate = Column(Float, default=0.10) # 10%
    min_hourly_rate = Column(Float, default=250.0) # INR
    max_travel_radius = Column(Float, default=25.0) # km
    emergency_bonus_multiplier = Column(Float, default=1.5)
    auto_assign_fairness_weight = Column(Float, default=0.3)
