from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class LoginPayload(BaseModel):
    email: EmailStr
    password: str

class RegisterCustomerPayload(BaseModel):
    name: str
    email: EmailStr
    phone: str
    password: str
    address: Optional[str] = ""

class RegisterWorkerPayload(BaseModel):
    name: str
    email: EmailStr
    phone: str
    password: str
    skills: List[str] # List of service names or service IDs
    experience: int
    cooperativeId: Optional[str] = None
    serviceLocation: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict
