from pydantic import BaseModel
from typing import List

class CooperativeSettingsUpdate(BaseModel):
    commission_rate: float
    min_hourly_rate: float
    max_travel_radius: float
    emergency_bonus_multiplier: float
    auto_assign_fairness_weight: float

class AnalyticsSummaryResponse(BaseModel):
    totalWorkers: int
    verifiedWorkers: int
    pendingVerifications: int
    availableWorkers: int
    activeBookings: int
    completedBookings: int
    pendingComplaints: int
    averageRating: float
    serviceDemand: List[dict]
    bookingsByStatus: List[dict]
