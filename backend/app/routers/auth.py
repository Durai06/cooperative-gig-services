
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import settings
from app.models.user import User
from app.models.worker import Worker
from app.models.service import Service
from app.schemas.auth import (
    LoginPayload,
    RegisterCustomerPayload,
    RegisterWorkerPayload,
    ForgotPasswordPayload,
    UpdateProfilePayload,
)
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

def format_user_dict(user: User) -> dict:
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "phone": user.phone,
        "role": user.role,
        "avatarUrl": user.avatar_url,
        "address": user.address,
        "createdAt": user.created_at.isoformat() if user.created_at else None,
    }

@router.post("/login")
def login(payload: LoginPayload, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email.ilike(payload.email)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No account found with this email address."
        )
    
    # Check password with support for demo password in debug mode
    is_valid = verify_password(payload.password, user.password_hash)
    if not is_valid and settings.DEBUG and payload.password in ["password123", "demo123"]:
        is_valid = True

    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials."
        )
    
    token = create_access_token({"sub": user.id, "role": user.role, "email": user.email})
    return {
        "success": True,
        "user": format_user_dict(user),
        "token": token
    }

@router.post("/register-customer")
def register_customer(payload: RegisterCustomerPayload, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email.ilike(payload.email)).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists."
        )
    
    user = User(
        name=payload.name,
        email=payload.email,
        phone=payload.phone,
        password_hash=get_password_hash(payload.password),
        role="customer",
        address=payload.address or ""
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": user.id, "role": user.role, "email": user.email})
    return {
        "success": True,
        "user": format_user_dict(user),
        "token": token
    }

@router.post("/register-worker")
def register_worker(payload: RegisterWorkerPayload, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email.ilike(payload.email)).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists."
        )
    
    user = User(
        name=payload.name,
        email=payload.email,
        phone=payload.phone,
        password_hash=get_password_hash(payload.password),
        role="worker",
        address=payload.serviceLocation
    )
    db.add(user)
    db.flush()

    # Look up registered services to attach correct service names
    all_services = db.query(Service).all()
    services_by_id = {s.id: s for s in all_services}
    services_by_cat = {s.category: s for s in all_services}

    skills_data = []
    for idx, skill_ident in enumerate(payload.skills):
        matched = services_by_id.get(skill_ident) or services_by_cat.get(skill_ident)
        svc_id = matched.id if matched else skill_ident
        svc_name = matched.name if matched else skill_ident
        skills_data.append({
            "id": f"sk-{user.id}-{idx}",
            "serviceId": svc_id,
            "serviceName": svc_name
        })

    worker = Worker(
        user_id=user.id,
        cooperative_id=payload.cooperativeId,
        experience=payload.experience,
        location=payload.serviceLocation,
        verification_status="pending",
        skills=skills_data,
        availability=True
    )
    db.add(worker)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": user.id, "role": user.role, "email": user.email})
    return {
        "success": True,
        "user": format_user_dict(user),
        "token": token
    }

@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordPayload, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email.ilike(payload.email)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found with this email address."
        )
    return {
        "success": True,
        "message": "Password reset instructions have been sent to your email address."
    }

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "success": True,
        "user": format_user_dict(current_user)
    }

@router.patch("/profile")
@router.patch("/me")
def update_profile(
    payload: UpdateProfilePayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if payload.name is not None and payload.name.strip():
        current_user.name = payload.name.strip()
    if payload.phone is not None and payload.phone.strip():
        current_user.phone = payload.phone.strip()
    if payload.address is not None:
        current_user.address = payload.address.strip()
    if payload.avatarUrl is not None:
        current_user.avatar_url = payload.avatarUrl.strip()

    db.commit()
    db.refresh(current_user)
    return {
        "success": True,
        "user": format_user_dict(current_user)
    }
