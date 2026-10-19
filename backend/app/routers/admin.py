from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.user import User
from app.models.worker import Worker
from app.models.booking import Booking
from app.models.complaint import Complaint
from app.models.rating import Rating
from app.models.service import Service
from app.models.settings import CooperativeSettings
from app.schemas.admin import CooperativeSettingsUpdate
from app.core.dependencies import require_role

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.get("/analytics")
def get_analytics(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role(["admin"]))
):
    total_workers = db.query(Worker).count()
    verified_workers = db.query(Worker).filter(Worker.verification_status == "verified").count()
    pending_verifications = db.query(Worker).filter(Worker.verification_status == "pending").count()
    available_workers = db.query(Worker).filter(Worker.availability == True).count()

    active_bookings = db.query(Booking).filter(
        Booking.status.in_(["pending", "worker_assigned", "accepted", "in_progress"])
    ).count()
    completed_bookings = db.query(Booking).filter(Booking.status == "completed").count()

    pending_complaints = db.query(Complaint).filter(Complaint.status.in_(["open", "under_review"])).count()

    # Average rating
    avg_rating_result = db.query(func.avg(Rating.overall)).scalar()
    average_rating = round(avg_rating_result, 1) if avg_rating_result else 0.0

    # Service demand
    service_demand_rows = (
        db.query(Service.id, Service.name, func.count(Booking.id).label("count"))
        .join(Booking, Booking.service_id == Service.id, isouter=True)
        .group_by(Service.id, Service.name)
        .all()
    )
    service_demand = [
        {"serviceId": r[0], "serviceName": r[1], "bookingCount": r[2]}
        for r in service_demand_rows
    ]

    # Bookings by status
    status_rows = (
        db.query(Booking.status, func.count(Booking.id).label("count"))
        .group_by(Booking.status)
        .all()
    )
    bookings_by_status = [{"status": r[0], "count": r[1]} for r in status_rows]

    return {
        "totalWorkers": total_workers,
        "verifiedWorkers": verified_workers,
        "pendingVerifications": pending_verifications,
        "availableWorkers": available_workers,
        "activeBookings": active_bookings,
        "completedBookings": completed_bookings,
        "pendingComplaints": pending_complaints,
        "averageRating": average_rating,
        "serviceDemand": service_demand,
        "bookingsByStatus": bookings_by_status,
    }

@router.get("/settings")
def get_settings(db: Session = Depends(get_db)):
    settings = db.query(CooperativeSettings).first()
    if not settings:
        settings = CooperativeSettings()
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return {
        "commissionRate": settings.commission_rate,
        "minHourlyRate": settings.min_hourly_rate,
        "maxTravelRadius": settings.max_travel_radius,
        "emergencyBonusMultiplier": settings.emergency_bonus_multiplier,
        "autoAssignFairnessWeight": settings.auto_assign_fairness_weight,
    }

@router.patch("/settings")
def update_settings(
    payload: CooperativeSettingsUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role(["admin"]))
):
    settings = db.query(CooperativeSettings).first()
    if not settings:
        settings = CooperativeSettings()
        db.add(settings)

    settings.commission_rate = payload.commission_rate
    settings.min_hourly_rate = payload.min_hourly_rate
    settings.max_travel_radius = payload.max_travel_radius
    settings.emergency_bonus_multiplier = payload.emergency_bonus_multiplier
    settings.auto_assign_fairness_weight = payload.auto_assign_fairness_weight
    db.commit()
    db.refresh(settings)
    return {"success": True, "message": "Settings updated successfully"}
