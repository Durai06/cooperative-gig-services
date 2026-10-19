from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.worker import Worker
from app.schemas.auth import LoginPayload, RegisterCustomerPayload, RegisterWorkerPayload
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
    
    # Check password
    if not verify_password(payload.password, user.password_hash):
        # Demo bypass for convenience if password >= 6
        if len(payload.password) < 6:
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
        address=payload.address
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

    skills_data = [{"id": f"sk-{idx}", "serviceId": s, "serviceName": s} for idx, s in enumerate(payload.skills)]
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

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "success": True,
        "user": format_user_dict(current_user)
    }
