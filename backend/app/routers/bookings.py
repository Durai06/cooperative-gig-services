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
from app.schemas.booking import (
    CreateBookingPayload,
    UpdateBookingStatusPayload,
    AssignWorkerPayload,
    CancelBookingPayload,
    RejectBookingPayload,
)
from app.core.dependencies import get_current_user, require_role
from app.core.transitions import assert_transition
from app.core.matching import check_eligibility, fits_schedule, haversine_km
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
    s_fee = b.service_fee if b.service_fee is not None else (b.service.base_price if b.service else 300.0)
    b_chg = b.booking_charge if b.booking_charge is not None else 100.0
    tot = b.total_amount if b.total_amount is not None else (s_fee + b_chg)
    s_paise = b.service_fee_paise if b.service_fee_paise is not None else int(round(s_fee * 100))
    b_paise = b.booking_charge_paise if b.booking_charge_paise is not None else int(round(b_chg * 100))
    t_paise = b.total_amount_paise if b.total_amount_paise is not None else (s_paise + b_paise)

    return {
        "id": b.id,
        "customerId": b.customer_id,
        "customer": format_user_dict(b.customer) if b.customer else None,
        "workerId": b.worker_id,
        "worker": format_worker_dict(b.worker) if b.worker else None,
        "serviceId": b.service_id,
        "service": service_dict,
        "servicePrice": s_fee,
        "bookingCharge": b_chg,
        "totalAmount": tot,
        "servicePricePaise": s_paise,
        "bookingChargePaise": b_paise,
        "totalAmountPaise": t_paise,
        "paymentMethod": b.payment_method or "cash",
        "paymentStatus": b.payment_status or "pending",
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
    # Role-based restriction:
    if current_user.role == "customer":
        query = query.filter(Booking.customer_id == current_user.id)
    elif current_user.role == "worker":
        worker = db.query(Worker).filter(Worker.user_id == current_user.id).first()
        if worker:
            query = query.filter(
                (Booking.worker_id == worker.id) | 
                ((Booking.status == "pending") & (Booking.worker_id == None))
            )
        else:
            return []
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
def get_booking(
    booking_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    
    # Authorization check
    if current_user.role == "customer" and booking.customer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have access to this booking.")
    if current_user.role == "worker":
        worker = db.query(Worker).filter(Worker.user_id == current_user.id).first()
        if not worker or (booking.worker_id != worker.id and booking.worker_id is not None):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have access to this booking.")

    return format_booking_dict(booking)

@router.post("")
def create_booking(
    payload: CreateBookingPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["customer", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only customer accounts can create bookings."
        )

    service = db.query(Service).filter(Service.id == payload.serviceId).first()
    if not service:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")
    
    if len(payload.description.strip()) < 5:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Please provide a valid description.")
    if len(payload.location.strip()) < 3:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Please provide a valid location.")

    booking_status = "pending"
    assigned_worker = None

    if payload.workerId:
        assigned_worker = db.query(Worker).filter(Worker.id == payload.workerId).first()
        if not assigned_worker:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assigned worker not found")
        
        # Verify eligibility
        eligibility = check_eligibility(assigned_worker, payload.serviceId)
        if not eligibility["eligible"]:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=eligibility["reason"])
        
        # Verify schedule
        if not fits_schedule(assigned_worker, payload.preferredDate, payload.preferredTime, payload.emergency or False):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Worker is outside their working schedule.")
        
        # Check collision with existing active bookings
        collision = db.query(Booking).filter(
            Booking.worker_id == assigned_worker.id,
            Booking.preferred_date == payload.preferredDate,
            Booking.preferred_time == payload.preferredTime,
            ~Booking.status.in_(["cancelled", "completed"])
        ).first()
        if collision:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Worker is already booked for this date and time.")

        booking_status = "worker_assigned"
        assigned_worker.active_jobs += 1

    # Mandatory fixed 100 INR booking service charge (never trust prices supplied by client)
    s_fee = float(service.base_price)
    b_charge = 100.0
    tot = s_fee + b_charge
    s_paise = int(round(s_fee * 100))
    b_paise = 10000
    tot_paise = s_paise + b_paise

    booking = Booking(
        customer_id=current_user.id,
        worker_id=payload.workerId if payload.workerId else None,
        service_id=payload.serviceId,
        service_fee=s_fee,
        booking_charge=b_charge,
        total_amount=tot,
        service_fee_paise=s_paise,
        booking_charge_paise=b_paise,
        total_amount_paise=tot_paise,
        payment_method="cash",
        payment_status="pending",
        description=payload.description.strip(),
        location=payload.location.strip(),
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

    # Notification to customer
    db.add(Notification(
        user_id=current_user.id,
        type="worker_assigned" if payload.workerId else "new_job_request",
        title="Booking Request Created" if not payload.workerId else "Worker Assigned",
        body="Your booking request has been saved. Professional assignment in progress." if not payload.workerId else f"{assigned_worker.user.name if assigned_worker and assigned_worker.user else 'Worker'} has received your request.",
        data={"bookingId": booking.id}
    ))

    # Notification to worker if assigned
    if assigned_worker:
        db.add(Notification(
            user_id=assigned_worker.user_id,
            type="new_job_request",
            title="New Service Request",
            body=f"You have a new request for {service.name} at {payload.location}.",
            data={"bookingId": booking.id}
        ))

    db.commit()
    db.refresh(booking)
    return format_booking_dict(booking)

@router.patch("/{booking_id}/assign")
def assign_worker(
    booking_id: str,
    payload: AssignWorkerPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    
    # Customer or Admin permission
    if current_user.role == "customer":
        if booking.customer_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This booking belongs to another customer.")
    elif current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the customer or an admin can assign a worker to this booking.")

    # Status transition check
    assert_transition(booking.status, "worker_assigned")

    worker = db.query(Worker).filter(Worker.id == payload.workerId).first()
    if not worker:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Worker not found")

    # Eligibility check
    eligibility = check_eligibility(worker, booking.service_id)
    if not eligibility["eligible"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=eligibility["reason"])

    # Schedule check
    if not fits_schedule(worker, booking.preferred_date, booking.preferred_time, booking.emergency or False):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Worker is outside their working schedule.")

    # Distance check
    if (booking.latitude is not None and booking.longitude is not None and
        worker.latitude is not None and worker.longitude is not None):
        dist_km = haversine_km(worker.latitude, worker.longitude, booking.latitude, booking.longitude)
        max_radius = worker.service_radius_km or 30.0
        if dist_km > max_radius:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Worker is outside their service area ({dist_km:.1f} km vs max {max_radius:.1f} km).")

    # Time slot collision check
    collision = db.query(Booking).filter(
        Booking.id != booking.id,
        Booking.worker_id == worker.id,
        Booking.preferred_date == booking.preferred_date,
        Booking.preferred_time == booking.preferred_time,
        ~Booking.status.in_(["cancelled", "completed"])
    ).first()
    if collision:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Worker is already booked for this date and time.")

    # If previously assigned to another worker, adjust their active_jobs
    if booking.worker_id and booking.worker_id != worker.id:
        old_worker = db.query(Worker).filter(Worker.id == booking.worker_id).first()
        if old_worker:
            old_worker.active_jobs = max(0, old_worker.active_jobs - 1)

    booking.worker_id = worker.id
    booking.status = "worker_assigned"
    worker.active_jobs += 1

    service_name = booking.service.name if booking.service else "Service"
    worker_name = worker.user.name if worker.user else "Worker"

    # Notification to worker
    db.add(Notification(
        user_id=worker.user_id,
        type="new_job_request",
        title="New Job Request",
        body=f"{service_name} at {booking.location}",
        data={"bookingId": booking.id}
    ))

    # Notification to customer
    db.add(Notification(
        user_id=booking.customer_id,
        type="worker_assigned",
        title="Worker Assigned",
        body=f"{worker_name} has received your request.",
        data={"bookingId": booking.id}
    ))

    db.commit()
    db.refresh(booking)
    return format_booking_dict(booking)

@router.patch("/{booking_id}/cancel")
def cancel_booking(
    booking_id: str,
    payload: Optional[CancelBookingPayload] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    if current_user.role == "customer":
        if booking.customer_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This booking belongs to another customer.")
    elif current_user.role == "worker":
        worker = db.query(Worker).filter(Worker.user_id == current_user.id).first()
        if not worker or booking.worker_id != worker.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only cancel bookings assigned to you.")
    elif current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to cancel this booking.")

    cancellable = ["pending", "worker_assigned", "accepted"]
    if booking.status not in cancellable:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"This booking cannot be cancelled at status '{booking.status}'."
        )

    booking.status = "cancelled"
    if booking.worker:
        booking.worker.active_jobs = max(0, booking.worker.active_jobs - 1)
        # Notify worker
        db.add(Notification(
            user_id=booking.worker.user_id,
            type="booking_cancelled",
            title="Booking Cancelled",
            body="The customer cancelled this request.",
            data={"bookingId": booking.id}
        ))

    # Notify customer
    db.add(Notification(
        user_id=booking.customer_id,
        type="booking_cancelled",
        title="Booking Cancelled",
        body="Your booking has been cancelled.",
        data={"bookingId": booking.id}
    ))

    db.commit()
    db.refresh(booking)
    return format_booking_dict(booking)

@router.patch("/{booking_id}/reject")
def reject_job(
    booking_id: str,
    payload: Optional[RejectBookingPayload] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    # Check worker ownership or admin
    worker = db.query(Worker).filter(Worker.id == booking.worker_id).first()
    if current_user.role == "worker":
        if not worker or worker.user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to reject this job.")
    elif current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized.")

    if booking.status != "worker_assigned":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only assigned jobs awaiting acceptance can be rejected.")

    if worker:
        worker.active_jobs = max(0, worker.active_jobs - 1)

    booking.worker_id = None
    booking.status = "pending"

    # Notify customer
    db.add(Notification(
        user_id=booking.customer_id,
        type="booking_cancelled",
        title="Choose another worker",
        body="Your worker could not accept. Your booking is saved for reassignment.",
        data={"bookingId": booking.id}
    ))

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
    
    # Handle rejection shortcut
    if payload.status == "rejected":
        return reject_job(booking_id=booking_id, payload=RejectBookingPayload(reason=payload.cancellationReason), db=db, current_user=current_user)

    # Validate role permissions
    if current_user.role == "worker":
        worker = db.query(Worker).filter(Worker.user_id == current_user.id).first()
        if not worker or booking.worker_id != worker.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This job is assigned to another worker.")
        if payload.status not in ["accepted", "in_progress", "completed"]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Workers cannot transition to this status.")

    if current_user.role == "customer":
        if booking.customer_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
        if payload.status != "cancelled":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Customers can only cancel bookings.")

    # Validate transition
    assert_transition(booking.status, payload.status)

    # Acceptance eligibility check
    if payload.status == "accepted" and booking.worker:
        eligibility = check_eligibility(booking.worker, booking.service_id)
        if not eligibility["eligible"]:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You must be verified and available to accept work.")

    booking.status = payload.status

    service_name = booking.service.name if booking.service else "service"

    # Status-specific state updates and notifications
    if payload.status == "accepted":
        db.add(Notification(
            user_id=booking.customer_id,
            type="booking_accepted",
            title="Booking Accepted",
            body=f"Your {service_name} booking was accepted by your professional.",
            data={"bookingId": booking.id}
        ))
    elif payload.status == "in_progress":
        db.add(Notification(
            user_id=booking.customer_id,
            type="job_in_progress",
            title="Job In Progress",
            body=f"Work has started on your {service_name} booking.",
            data={"bookingId": booking.id}
        ))
    elif payload.status == "completed":
        if booking.worker:
            booking.worker.active_jobs = max(0, booking.worker.active_jobs - 1)
            booking.worker.completed_jobs += 1
            
            # Calculate worker earnings strictly from service fee snapshot (platform booking charge is retained by cooperative)
            settings = db.query(CooperativeSettings).first()
            commission = settings.commission_rate if settings else 0.10
            service_fee = booking.service_fee if booking.service_fee is not None else (booking.service.base_price if booking.service else 300.0)
            payout = round(service_fee * (1.0 - commission), 2)
            booking.worker.earnings += payout

        # Notification for customer to review
        db.add(Notification(
            user_id=booking.customer_id,
            type="service_completed",
            title="Service Completed",
            body=f"Your booking for {service_name} has been completed. Please rate your worker!",
            data={"bookingId": booking.id}
        ))
    elif payload.status == "cancelled":
        if booking.worker:
            booking.worker.active_jobs = max(0, booking.worker.active_jobs - 1)
            db.add(Notification(
                user_id=booking.worker.user_id,
                type="booking_cancelled",
                title="Booking Cancelled",
                body="The booking has been cancelled.",
                data={"bookingId": booking.id}
            ))
        db.add(Notification(
            user_id=booking.customer_id,
            type="booking_cancelled",
            title="Booking Cancelled",
            body="Your booking has been cancelled.",
            data={"bookingId": booking.id}
        ))

    db.commit()
    db.refresh(booking)
    return format_booking_dict(booking)
