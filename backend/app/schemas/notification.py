from pydantic import BaseModel
from typing import Optional, Dict
from datetime import datetime

class NotificationResponse(BaseModel):
    id: str
    user_id: str
    type: str
    title: str
    body: str
    data: Optional[Dict[str, str]] = None
    read: bool
    created_at: datetime

    class Config:
        from_attributes = True
