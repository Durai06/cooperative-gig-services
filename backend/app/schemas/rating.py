from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class SubmitRatingPayload(BaseModel):
    bookingId: str
    workerId: str
    overall: float
    workQuality: float
    punctuality: float
    behaviour: float
    professionalism: float
    review: Optional[str] = ""

class RatingResponse(BaseModel):
    id: str
    booking_id: str
    customer_id: str
    worker_id: str
    overall: float
    work_quality: float
    punctuality: float
    behaviour: float
    professionalism: float
    review: str
    created_at: datetime

    class Config:
        from_attributes = True
