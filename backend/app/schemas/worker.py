from pydantic import BaseModel
from typing import Optional, List, Any

class WorkerBase(BaseModel):
    experience: int
    location: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    service_radius_km: Optional[float] = 15.0
    emergency_available: Optional[bool] = False
    availability: Optional[bool] = True

class WorkerUpdateAvailability(BaseModel):
    availability: Optional[bool] = None
    schedule: Optional[List[dict]] = None
    service_radius_km: Optional[float] = None
    emergency_available: Optional[bool] = None

class WorkerVerificationUpdate(BaseModel):
    status: str # verified, rejected, pending

class WorkerResponse(BaseModel):
    id: str
    user_id: str
    user: Optional[dict] = None
    cooperative_id: Optional[str] = None
    experience: int
    rating: float
    total_ratings: int
    availability: bool
    location: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    verification_status: str
    skills: List[Any]
    active_jobs: int
    completed_jobs: int
    earnings: float
    schedule: Optional[List[dict]] = []
    service_radius_km: Optional[float] = 15.0
    emergency_available: Optional[bool] = False

    class Config:
        from_attributes = True
