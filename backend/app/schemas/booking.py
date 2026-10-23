from pydantic import BaseModel, field_validator
from typing import Optional, Any
from datetime import datetime, date
import re

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
    paymentMethod: Optional[str] = "cash"

    @field_validator("description")
    @classmethod
    def validate_description(cls, v: str) -> str:
        s = v.strip()
        if len(s) < 5:
            raise ValueError("Please provide a description with at least 5 characters.")
        if len(s) > 1000:
            raise ValueError("Description cannot exceed 1000 characters.")
        return s

    @field_validator("location")
    @classmethod
    def validate_location(cls, v: str) -> str:
        s = v.strip()
        if len(s) < 3:
            raise ValueError("Please provide a valid service address (min 3 characters).")
        if len(s) > 255:
            raise ValueError("Location address cannot exceed 255 characters.")
        return s

    @field_validator("preferredDate")
    @classmethod
    def validate_preferred_date(cls, v: str) -> str:
        s = v.strip()
        try:
            booking_d = datetime.strptime(s, "%Y-%m-%d").date()
        except ValueError:
            raise ValueError("Preferred date must be in YYYY-MM-DD format.")
        today = date.today()
        if booking_d < today:
            raise ValueError("Booking date cannot be in the past.")
        return s

    @field_validator("preferredTime")
    @classmethod
    def validate_preferred_time(cls, v: str) -> str:
        s = v.strip()
        if not re.match(r"^\d{1,2}:\d{2}$", s):
            raise ValueError("Preferred time must be in HH:MM format (e.g. 10:00).")
        return s

class AssignWorkerPayload(BaseModel):
    workerId: str

    @field_validator("workerId")
    @classmethod
    def validate_worker_id(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("workerId is required.")
        return v.strip()

class CancelBookingPayload(BaseModel):
    reason: Optional[str] = None

class RejectBookingPayload(BaseModel):
    reason: Optional[str] = None

class UpdateBookingStatusPayload(BaseModel):
    status: str  # accepted, in_progress, completed, cancelled, rejected
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
    service_fee: Optional[float] = None
    booking_charge: Optional[float] = 100.0
    total_amount: Optional[float] = None
    service_fee_paise: Optional[int] = None
    booking_charge_paise: Optional[int] = 10000
    total_amount_paise: Optional[int] = None
    payment_method: Optional[str] = "cash"
    payment_status: Optional[str] = "pending"
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
