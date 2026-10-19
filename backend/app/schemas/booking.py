from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime

class CreateBookingPayload(BaseModel):
    serviceId: str
    workerId: Optional[str] = None
    description: str
    location: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    preferredDate: str
    preferredTime: str
    emergency: Optional[bool] = False
    notes: Optional[str] = None

class UpdateBookingStatusPayload(BaseModel):
    status: str # accepted, in_progress, completed, cancelled, rejected
    workerId: Optional[str] = None
    cancellationReason: Optional[str] = None

class BookingResponse(BaseModel):
    id: str
    customer_id: str
    customer: Optional[dict] = None
    worker_id: Optional[str] = None
    worker: Optional[dict] = None
    service_id: str
    service: Optional[dict] = None
    description: str
    location: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    preferred_date: str
    preferred_time: str
    emergency: bool
    status: str
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
