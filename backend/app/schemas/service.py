from pydantic import BaseModel
from typing import Optional

class ServiceBase(BaseModel):
    name: str
    description: str
    base_price: float
    icon: str
    category: str

class ServiceCreate(ServiceBase):
    pass

class ServiceResponse(ServiceBase):
    id: str

    class Config:
        from_attributes = True
