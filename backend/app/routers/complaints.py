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
    booking_dict = None
    if c.booking:
        booking_dict = {
            "id": c.booking.id,
            "serviceId": c.booking.service_id,
            "serviceName": c.booking.service.name if c.booking.service else None,
            "status": c.booking.status,
            "location": c.booking.location,
            "preferredDate": c.booking.preferred_date,
            "preferredTime": c.booking.preferred_time,
        }
    return {
        "id": c.id,
        "bookingId": c.booking_id,
        "booking": booking_dict,
        "customerId": c.customer_id,
        "customer": {"id": c.customer.id, "name": c.customer.name, "email": c.customer.email} if c.customer else None,
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
    elif current_user.role == "worker":
        # Workers can see complaints tied to their bookings
        query = query.join(Booking, Booking.id == Complaint.booking_id).filter(Booking.worker_id == current_user.id)
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

    if current_user.role == "customer" and booking.customer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Choose one of your own bookings.")

    if len(payload.description.strip()) < 10:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Please describe the issue in at least 10 characters.")

    complaint = Complaint(
        booking_id=payload.bookingId,
        customer_id=current_user.id,
        category=payload.category,
        description=payload.description.strip(),
        photos=(payload.photos or [])[:3],
        status="open"
    )
    db.add(complaint)

    # Notify customer that complaint is logged
    db.add(Notification(
        user_id=current_user.id,
        type="complaint_update",
        title="Complaint Received",
        body="Your cooperative can now review your complaint.",
        data={"bookingId": payload.bookingId}
    ))

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

    target_status = payload.status or "resolved"
    current_status = complaint.status

    if current_status == "resolved" and target_status != "resolved":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Resolved complaint cannot move backwards.")
    if current_status == "under_review" and target_status == "open":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Complaint cannot move back to open.")

    if target_status == "resolved" and (not payload.resolutionNote or not payload.resolutionNote.strip()):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Please add a resolution note.")

    complaint.status = target_status
    if payload.resolutionNote:
        complaint.resolution_note = payload.resolutionNote.strip()

    # Notify the customer
    db.add(Notification(
        user_id=complaint.customer_id,
        type="complaint_update",
        title="Complaint Updated",
        body=f"Your complaint is now {target_status.replace('_', ' ')}.",
        data={"bookingId": complaint.booking_id}
    ))

    db.commit()
    db.refresh(complaint)
    return format_complaint_dict(complaint)
