from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List
import re

class LoginPayload(BaseModel):
    email: EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Password is required.")
        return v

class RegisterCustomerPayload(BaseModel):
    name: str
    email: EmailStr
    phone: str
    password: str
    address: Optional[str] = ""

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        s = v.strip()
        if len(s) < 2:
            raise ValueError("Name must be at least 2 characters long.")
        if len(s) > 100:
            raise ValueError("Name cannot exceed 100 characters.")
        return s

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        digits = re.sub(r"\D", "", v)
        if len(digits) < 10:
            raise ValueError("Phone number must have at least 10 digits.")
        return v.strip()

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters long.")
        return v

class RegisterWorkerPayload(BaseModel):
    name: str
    email: EmailStr
    phone: str
    password: str
    skills: List[str]  # List of service IDs or service names
    experience: int
    cooperativeId: Optional[str] = None
    serviceLocation: str

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        s = v.strip()
        if len(s) < 2:
            raise ValueError("Name must be at least 2 characters long.")
        return s

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        digits = re.sub(r"\D", "", v)
        if len(digits) < 10:
            raise ValueError("Phone number must have at least 10 digits.")
        return v.strip()

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters long.")
        return v

    @field_validator("skills")
    @classmethod
    def validate_skills(cls, v: List[str]) -> List[str]:
        if not v or len(v) == 0:
            raise ValueError("Please select at least one trade skill.")
        return v

    @field_validator("experience")
    @classmethod
    def validate_experience(cls, v: int) -> int:
        if v < 0 or v > 60:
            raise ValueError("Experience must be between 0 and 60 years.")
        return v

class ForgotPasswordPayload(BaseModel):
    email: EmailStr

class ResetPasswordPayload(BaseModel):
    email: EmailStr
    phone: str
    newPassword: str

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        digits = re.sub(r"\D", "", v)
        if len(digits) < 10:
            raise ValueError("Phone number must have at least 10 digits.")
        return v.strip()

    @field_validator("newPassword")
    @classmethod
    def validate_new_password(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("New password must be at least 6 characters long.")
        return v

class UpdateProfilePayload(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    avatarUrl: Optional[str] = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            s = v.strip()
            if len(s) < 2:
                raise ValueError("Name must be at least 2 characters long.")
            return s
        return v

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            digits = re.sub(r"\D", "", v)
            if len(digits) < 10:
                raise ValueError("Phone number must have at least 10 digits.")
            return v.strip()
        return v

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict
