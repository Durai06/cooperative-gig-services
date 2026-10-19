from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional, List
from app.database import get_db
from app.models.worker import Worker
from app.models.user import User
from app.schemas.worker import WorkerResponse, WorkerUpdateAvailability, WorkerVerificationUpdate
from app.core.dependencies import get_current_user, require_role

router = APIRouter(prefix="/workers", tags=["Workers"])

def format_worker_dict(worker: Worker) -> dict:
    user_dict = None
    if worker.user:
        user_dict = {
            "id": worker.user.id,
            "name": worker.user.name,
            "email": worker.user.email,
            "phone": worker.user.phone,
            "role": worker.user.role,
            "avatarUrl": worker.user.avatar_url,
            "address": worker.user.address,
        }
    return {
        "id": worker.id,
        "userId": worker.user_id,
        "user": user_dict,
        "cooperativeId": worker.cooperative_id,
        "experience": worker.experience,
        "rating": worker.rating,
        "totalRatings": worker.total_ratings,
        "availability": worker.availability,
        "location": worker.location,
        "latitude": worker.latitude,
        "longitude": worker.longitude,
        "verificationStatus": worker.verification_status,
        "skills": worker.skills or [],
        "activeJobs": worker.active_jobs,
        "completedJobs": worker.completed_jobs,
        "earnings": worker.earnings,
        "schedule": worker.schedule or [],
        "serviceRadiusKm": worker.service_radius_km,
        "emergencyAvailable": worker.emergency_available,
    }

@router.get("")
def get_workers(
    verification_status: Optional[str] = None,
    service_id: Optional[str] = None,
    available_only: Optional[bool] = False,
    db: Session = Depends(get_db)
):
    query = db.query(Worker)
    if verification_status:
        query = query.filter(Worker.verification_status == verification_status)
    if available_only:
        query = query.filter(Worker.availability == True)
    
    workers = query.all()
    results = [format_worker_dict(w) for w in workers]
    if service_id:
        results = [w for w in results if any(s.get("serviceId") == service_id or s.get("serviceName") == service_id for s in w["skills"])]
    return results

@router.get("/{worker_id}")
def get_worker(worker_id: str, db: Session = Depends(get_db)):
    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not worker:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Worker not found")
    return format_worker_dict(worker)

@router.patch("/{worker_id}/availability")
def update_availability(
    worker_id: str,
    payload: WorkerUpdateAvailability,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not worker:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Worker not found")
    
    # Ensure current user is the worker or an admin
    if current_user.role != "admin" and worker.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to edit this worker profile")
    
    if payload.availability is not None:
        worker.availability = payload.availability
    if payload.schedule is not None:
        worker.schedule = payload.schedule
    if payload.service_radius_km is not None:
        worker.service_radius_km = payload.service_radius_km
    if payload.emergency_available is not None:
        worker.emergency_available = payload.emergency_available

    db.commit()
    db.refresh(worker)
    return format_worker_dict(worker)

@router.patch("/{worker_id}/verify")
def verify_worker(
    worker_id: str,
    payload: WorkerVerificationUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role(["admin"]))
):
    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not worker:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Worker not found")
    
    worker.verification_status = payload.status
    db.commit()
    db.refresh(worker)
    return format_worker_dict(worker)
