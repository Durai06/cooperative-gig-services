from pydantic import BaseModel
from typing import Optional

class CooperativeBase(BaseModel):
    name: str
    location: str
    contact: str

class CooperativeCreate(CooperativeBase):
    id: Optional[str] = None

class CooperativeResponse(CooperativeBase):
    id: str

    class Config:
        from_attributes = True
