from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class SubmitComplaintPayload(BaseModel):
    bookingId: str
    category: str
    description: str
    photos: Optional[List[str]] = []

class ResolveComplaintPayload(BaseModel):
    resolutionNote: str
    status: Optional[str] = "resolved" # resolved or under_review

class ComplaintResponse(BaseModel):
    id: str
    booking_id: str
    customer_id: str
    category: str
    description: str
    photos: List[str]
    status: str
    resolution_note: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
