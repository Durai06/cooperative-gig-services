from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional, List
from app.database import get_db
from app.models.booking import Booking
from app.models.worker import Worker
from app.models.service import Service
from app.models.user import User
from app.models.notification import Notification
from app.models.settings import CooperativeSettings
from app.schemas.booking import CreateBookingPayload, UpdateBookingStatusPayload
from app.core.dependencies import get_current_user
from app.core.transitions import assert_transition
from app.routers.workers import format_worker_dict
from app.routers.auth import format_user_dict

router = APIRouter(prefix="/bookings", tags=["Bookings"])

def format_booking_dict(b: Booking) -> dict:
    service_dict = None
    if b.service:
        service_dict = {
            "id": b.service.id,
            "name": b.service.name,
            "description": b.service.description,
            "basePrice": b.service.base_price,
            "icon": b.service.icon,
            "category": b.service.category,
        }
    return {
        "id": b.id,
        "customerId": b.customer_id,
        "customer": format_user_dict(b.customer) if b.customer else None,
        "workerId": b.worker_id,
        "worker": format_worker_dict(b.worker) if b.worker else None,
        "serviceId": b.service_id,
        "service": service_dict,
        "description": b.description,
        "location": b.location,
        "latitude": b.latitude,
        "longitude": b.longitude,
        "preferredDate": b.preferred_date,
        "preferredTime": b.preferred_time,
        "emergency": b.emergency,
        "status": b.status,
        "notes": b.notes,
        "createdAt": b.created_at.isoformat() if b.created_at else None,
        "updatedAt": b.updated_at.isoformat() if b.updated_at else None,
    }

@router.get("")
def get_bookings(
    customer_id: Optional[str] = None,
    worker_id: Optional[str] = None,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Booking)
    # Role-based restriction: customers only see their bookings, workers see assigned
    if current_user.role == "customer":
        query = query.filter(Booking.customer_id == current_user.id)
    elif current_user.role == "worker":
        worker = db.query(Worker).filter(Worker.user_id == current_user.id).first()
        if worker:
            query = query.filter((Booking.worker_id == worker.id) | ((Booking.status == "pending") & (Booking.worker_id == None)))
    else:
        # Admin can filter arbitrarily
        if customer_id:
            query = query.filter(Booking.customer_id == customer_id)
        if worker_id:
            query = query.filter(Booking.worker_id == worker_id)
    
    if status_filter:
        query = query.filter(Booking.status == status_filter)
    
    bookings = query.order_by(Booking.created_at.desc()).all()
    return [format_booking_dict(b) for b in bookings]

@router.get("/{booking_id}")
def get_booking(booking_id: str, db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    return format_booking_dict(booking)

@router.post("")
def create_booking(
    payload: CreateBookingPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = db.query(Service).filter(Service.id == payload.serviceId).first()
    if not service:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")
    
    booking_status = "worker_assigned" if payload.workerId else "pending"

    booking = Booking(
        customer_id=current_user.id,
        worker_id=payload.workerId,
        service_id=payload.serviceId,
        description=payload.description,
        location=payload.location,
        latitude=payload.latitude,
        longitude=payload.longitude,
        preferred_date=payload.preferredDate,
        preferred_time=payload.preferredTime,
        emergency=payload.emergency or False,
        status=booking_status,
        notes=payload.notes
    )
    db.add(booking)
    db.flush()

    # Create notification for worker if assigned
    if payload.workerId:
        assigned_worker = db.query(Worker).filter(Worker.id == payload.workerId).first()
        if assigned_worker:
            notif = Notification(
                user_id=assigned_worker.user_id,
                type="new_job_request",
                title="New Service Request",
                body=f"You have a new request for {service.name} at {payload.location}."
            )
            db.add(notif)
            assigned_worker.active_jobs += 1

    db.commit()
    db.refresh(booking)
    return format_booking_dict(booking)

@router.patch("/{booking_id}/status")
def update_booking_status(
    booking_id: str,
    payload: UpdateBookingStatusPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    
    # Handle rejection by worker (releases to pending)
    if payload.status == "rejected":
        if booking.worker:
            booking.worker.active_jobs = max(0, booking.worker.active_jobs - 1)
        booking.worker_id = None
        booking.status = "pending"
        db.commit()
        db.refresh(booking)
        return format_booking_dict(booking)

    # Validate transition
    assert_transition(booking.status, payload.status)
    booking.status = payload.status

    # If completing job
    if payload.status == "completed" and booking.worker:
        booking.worker.active_jobs = max(0, booking.worker.active_jobs - 1)
        booking.worker.completed_jobs += 1
        
        # Calculate earnings
        settings = db.query(CooperativeSettings).first()
        commission = settings.commission_rate if settings else 0.10
        base_price = booking.service.base_price if booking.service else 300.0
        payout = base_price * (1.0 - commission)
        booking.worker.earnings += payout

        # Notification for customer to review
        db.add(Notification(
            user_id=booking.customer_id,
            type="service_completed",
            title="Service Completed",
            body=f"Your booking for {booking.service.name if booking.service else 'service'} has been completed. Please rate your worker!"
        ))
    
    elif payload.status == "cancelled":
        if booking.worker:
            booking.worker.active_jobs = max(0, booking.worker.active_jobs - 1)

    db.commit()
    db.refresh(booking)
    return format_booking_dict(booking)
