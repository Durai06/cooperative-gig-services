from pydantic import BaseModel, EmailStr
from typing import Optional, List

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
    skills: List[str]  # List of service IDs or service names
    experience: int
    cooperativeId: Optional[str] = None
    serviceLocation: str

class ForgotPasswordPayload(BaseModel):
    email: EmailStr

class UpdateProfilePayload(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    avatarUrl: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict
