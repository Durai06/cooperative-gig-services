from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models.rating import Rating
from app.models.booking import Booking
from app.models.worker import Worker
from app.models.user import User
from app.models.notification import Notification
from app.schemas.rating import SubmitRatingPayload
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/ratings", tags=["Ratings"])

def format_rating_dict(r: Rating) -> dict:
    return {
        "id": r.id,
        "bookingId": r.booking_id,
        "customerId": r.customer_id,
        "workerId": r.worker_id,
        "overall": r.overall,
        "workQuality": r.work_quality,
        "punctuality": r.punctuality,
        "behaviour": r.behaviour,
        "professionalism": r.professionalism,
        "review": r.review,
        "createdAt": r.created_at.isoformat() if r.created_at else None,
    }

@router.get("")
def get_ratings(
    worker_id: Optional[str] = None,
    booking_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Rating)
    if worker_id:
        query = query.filter(Rating.worker_id == worker_id)
    if booking_id:
        query = query.filter(Rating.booking_id == booking_id)
    ratings = query.order_by(Rating.created_at.desc()).all()
    return [format_rating_dict(r) for r in ratings]

@router.post("")
def submit_rating(
    payload: SubmitRatingPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    booking = db.query(Booking).filter(Booking.id == payload.bookingId).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    if current_user.role == "customer" and booking.customer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only your own bookings can be reviewed.")

    if booking.status != "completed":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only completed bookings can be reviewed.")

    if booking.worker_id and booking.worker_id != payload.workerId:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Worker does not match booking assignment.")

    # Validate score range 1..5
    for field_name, score in [
        ("overall", payload.overall),
        ("workQuality", payload.workQuality),
        ("punctuality", payload.punctuality),
        ("behaviour", payload.behaviour),
        ("professionalism", payload.professionalism),
    ]:
        if not isinstance(score, (int, float)) or score < 1 or score > 5:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"{field_name} rating must be between 1 and 5.")

    existing = db.query(Rating).filter(Rating.booking_id == payload.bookingId).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Rating already submitted for this booking.")

    rating = Rating(
        booking_id=payload.bookingId,
        customer_id=current_user.id,
        worker_id=payload.workerId,
        overall=payload.overall,
        work_quality=payload.workQuality,
        punctuality=payload.punctuality,
        behaviour=payload.behaviour,
        professionalism=payload.professionalism,
        review=payload.review or ""
    )
    db.add(rating)

    # Recalculate worker's aggregate rating
    worker = db.query(Worker).filter(Worker.id == payload.workerId).first()
    if worker:
        all_ratings = db.query(Rating).filter(Rating.worker_id == payload.workerId).all()
        scores = [r.overall for r in all_ratings] + [payload.overall]
        worker.total_ratings = len(scores)
        worker.rating = round(sum(scores) / len(scores), 1)

        # Send notification to worker
        db.add(Notification(
            user_id=worker.user_id,
            type="new_review",
            title="New Customer Rating",
            body=f"You received a {payload.overall}★ rating from {current_user.name}."
        ))

    db.commit()
    db.refresh(rating)
    return format_rating_dict(rating)
