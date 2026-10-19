from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models.complaint import Complaint
from app.models.booking import Booking
from app.models.user import User
from app.models.notification import Notification
from app.schemas.complaint import SubmitComplaintPayload, ResolveComplaintPayload
from app.core.dependencies import get_current_user, require_role

router = APIRouter(prefix="/complaints", tags=["Complaints"])

def format_complaint_dict(c: Complaint) -> dict:
    return {
        "id": c.id,
        "bookingId": c.booking_id,
        "customerId": c.customer_id,
        "category": c.category,
        "description": c.description,
        "photos": c.photos or [],
        "status": c.status,
        "resolutionNote": c.resolution_note,
        "createdAt": c.created_at.isoformat() if c.created_at else None,
        "updatedAt": c.updated_at.isoformat() if c.updated_at else None,
    }

@router.get("")
def get_complaints(
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Complaint)
    if current_user.role == "customer":
        query = query.filter(Complaint.customer_id == current_user.id)
    if status_filter:
        query = query.filter(Complaint.status == status_filter)
    complaints = query.order_by(Complaint.created_at.desc()).all()
    return [format_complaint_dict(c) for c in complaints]

@router.post("")
def submit_complaint(
    payload: SubmitComplaintPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    booking = db.query(Booking).filter(Booking.id == payload.bookingId).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    complaint = Complaint(
        booking_id=payload.bookingId,
        customer_id=current_user.id,
        category=payload.category,
        description=payload.description,
        photos=payload.photos or [],
        status="open"
    )
    db.add(complaint)
    db.commit()
    db.refresh(complaint)
    return format_complaint_dict(complaint)

@router.patch("/{complaint_id}/resolve")
def resolve_complaint(
    complaint_id: str,
    payload: ResolveComplaintPayload,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role(["admin"]))
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found")

    complaint.status = payload.status or "resolved"
    complaint.resolution_note = payload.resolutionNote

    # Notify the customer
    db.add(Notification(
        user_id=complaint.customer_id,
        type="complaint_update",
        title="Complaint Update",
        body=f"Your complaint has been {complaint.status}. Note: {payload.resolutionNote}"
    ))

    db.commit()
    db.refresh(complaint)
    return format_complaint_dict(complaint)
