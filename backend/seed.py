"""
Seed script – populates the DB with demo cooperatives, services, users, workers,
bookings, ratings, complaints and notifications matching the Sevai One demo.

Run once after setting up:
    python seed.py
"""

import sys
import os
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, SessionLocal, Base
from app.models import (
    User, Cooperative, Service, Worker,
    Booking, Rating, Complaint, Notification,
    CooperativeSettings
)
from app.core.security import get_password_hash

# Ensure all database tables exist
Base.metadata.create_all(bind=engine)

db = SessionLocal()

def seed():
    print("=" * 60)
    print("  Sevai One Database Seeder")
    print("=" * 60)

    # 1. Cooperative Settings
    if not db.query(CooperativeSettings).first():
        settings = CooperativeSettings(
            commission_rate=0.10,
            min_hourly_rate=150.0,
            max_travel_radius=30.0,
            emergency_bonus_multiplier=1.5,
            auto_assign_fairness_weight=0.3,
        )
        db.add(settings)
        db.commit()
        print("  [OK] Cooperative settings")

    # 2. Cooperatives
    if db.query(Cooperative).count() == 0:
        coops = [
            Cooperative(id="coop-1", name="Bengaluru Labour Cooperative", location="Bengaluru, Karnataka", contact="+91 80 4567 8901"),
            Cooperative(id="coop-2", name="Mumbai Workers Union Coop",    location="Mumbai, Maharashtra",  contact="+91 22 1234 5678"),
            Cooperative(id="coop-3", name="Delhi Skilled Workers Society", location="New Delhi",           contact="+91 11 9876 5432"),
            Cooperative(id="coop-4", name="Chennai Service Cooperative",   location="Chennai, Tamil Nadu", contact="+91 44 7654 3210"),
        ]
        db.add_all(coops)
        db.commit()
        print(f"  [OK] {len(coops)} Cooperatives")

    # 3. Services
    if db.query(Service).count() == 0:
        services = [
            Service(id="svc-1",  name="Electrician",       description="Wiring, repairs & installations",  base_price=350.0, icon="zap",        category="electrician"),
            Service(id="svc-2",  name="Plumber",           description="Pipes, drains & fixtures",          base_price=300.0, icon="droplets",   category="plumber"),
            Service(id="svc-3",  name="Carpenter",         description="Furniture & woodwork",              base_price=400.0, icon="hammer",     category="carpenter"),
            Service(id="svc-4",  name="Painter",           description="Interior & exterior painting",      base_price=450.0, icon="paintbrush", category="painter"),
            Service(id="svc-5",  name="Cleaner",           description="Home & office deep cleaning",       base_price=250.0, icon="sparkles",   category="cleaner"),
            Service(id="svc-6",  name="Gardener",          description="Lawn care & landscaping",           base_price=280.0, icon="leaf",       category="gardener"),
            Service(id="svc-7",  name="Domestic Helper",   description="Household assistance & chores",     base_price=220.0, icon="home",       category="domestic_helper"),
            Service(id="svc-8",  name="Caregiver",         description="Elder & childcare assistance",      base_price=500.0, icon="heart",      category="caregiver"),
            Service(id="svc-9",  name="Driver",            description="Personal & commercial driving",     base_price=300.0, icon="car",        category="driver"),
            Service(id="svc-10", name="Technician",        description="Appliance & device repair",         base_price=380.0, icon="wrench",     category="technician"),
        ]
        db.add_all(services)
        db.commit()
        print(f"  [OK] {len(services)} Services")

    # 4. Demo Users
    demo_pwd = get_password_hash("password123")

    users_data = [
        {"id": "usr-admin-1",    "name": "Kavya Reddy",   "email": "admin@coopconnect.in",    "phone": "+91 98765 43210", "role": "admin",    "address": "Sevai One HQ, Bengaluru"},
        {"id": "usr-customer-1", "name": "Arjun Sharma",  "email": "customer@coopconnect.in", "phone": "+91 98765 11111", "role": "customer", "address": "12, MG Road, Bengaluru 560001"},
        {"id": "usr-customer-2", "name": "Deepa Menon",   "email": "deepa@coopconnect.in",    "phone": "+91 98765 77777", "role": "customer", "address": "45, Whitefield Main Road, Bengaluru"},
        {"id": "usr-worker-1",   "name": "Ravi Kumar",    "email": "worker@coopconnect.in",   "phone": "+91 98765 22222", "role": "worker",   "address": "Rajajinagar, Bengaluru"},
        {"id": "usr-worker-2",   "name": "Sita Devi",     "email": "sita@coopconnect.in",     "phone": "+91 98765 33333", "role": "worker",   "address": "Koramangala, Bengaluru"},
        {"id": "usr-worker-3",   "name": "Mohan Das",     "email": "mohan@coopconnect.in",    "phone": "+91 98765 44444", "role": "worker",   "address": "Indiranagar, Bengaluru"},
        {"id": "usr-worker-4",   "name": "Priya Patel",   "email": "priya@coopconnect.in",    "phone": "+91 98765 55555", "role": "worker",   "address": "HSR Layout, Bengaluru"},
        {"id": "usr-worker-5",   "name": "Suresh Naidu",  "email": "suresh@coopconnect.in",   "phone": "+91 98765 66666", "role": "worker",   "address": "Marathahalli, Bengaluru"},
    ]

    for u_info in users_data:
        if not db.query(User).filter(User.email == u_info["email"]).first():
            user = User(
                id=u_info["id"],
                name=u_info["name"],
                email=u_info["email"],
                phone=u_info["phone"],
                password_hash=demo_pwd,
                role=u_info["role"],
                address=u_info["address"]
            )
            db.add(user)
    db.commit()
    print("  [OK] Demo Users")

    # Standard weekly schedule
    default_schedule = [
        {"day": "Monday",    "enabled": True,  "shift": "09:00-18:00"},
        {"day": "Tuesday",   "enabled": True,  "shift": "09:00-18:00"},
        {"day": "Wednesday", "enabled": True,  "shift": "09:00-18:00"},
        {"day": "Thursday",  "enabled": True,  "shift": "09:00-18:00"},
        {"day": "Friday",    "enabled": True,  "shift": "09:00-18:00"},
        {"day": "Saturday",  "enabled": True,  "shift": "10:00-15:00"},
        {"day": "Sunday",    "enabled": False, "shift": "09:00-18:00"},
    ]

    # 5. Workers
    workers_data = [
        {
            "id": "wkr-1", "user_id": "usr-worker-1", "cooperative_id": "coop-1",
            "experience": 8, "rating": 4.7, "total_ratings": 124, "availability": True,
            "location": "Rajajinagar, Bengaluru", "latitude": 12.9982, "longitude": 77.5534,
            "verification_status": "verified", "active_jobs": 2, "completed_jobs": 156, "earnings": 128500.0,
            "service_radius_km": 15.0, "emergency_available": True,
            "skills": [
                {"id": "sk-1", "serviceId": "svc-1", "serviceName": "Electrician"},
                {"id": "sk-2", "serviceId": "svc-10", "serviceName": "Technician"},
            ]
        },
        {
            "id": "wkr-2", "user_id": "usr-worker-2", "cooperative_id": "coop-1",
            "experience": 5, "rating": 4.3, "total_ratings": 87, "availability": True,
            "location": "Koramangala, Bengaluru", "latitude": 12.9352, "longitude": 77.6245,
            "verification_status": "verified", "active_jobs": 1, "completed_jobs": 93, "earnings": 74200.0,
            "service_radius_km": 20.0, "emergency_available": True,
            "skills": [
                {"id": "sk-3", "serviceId": "svc-5", "serviceName": "Cleaner"},
                {"id": "sk-4", "serviceId": "svc-7", "serviceName": "Domestic Helper"},
            ]
        },
        {
            "id": "wkr-3", "user_id": "usr-worker-3", "cooperative_id": "coop-2",
            "experience": 12, "rating": 4.9, "total_ratings": 213, "availability": False,
            "location": "Indiranagar, Bengaluru", "latitude": 12.9716, "longitude": 77.6412,
            "verification_status": "verified", "active_jobs": 4, "completed_jobs": 287, "earnings": 235000.0,
            "service_radius_km": 25.0, "emergency_available": False,
            "skills": [
                {"id": "sk-5", "serviceId": "svc-2", "serviceName": "Plumber"},
                {"id": "sk-6", "serviceId": "svc-3", "serviceName": "Carpenter"},
            ]
        },
        {
            "id": "wkr-4", "user_id": "usr-worker-4", "cooperative_id": "coop-1",
            "experience": 3, "rating": 4.1, "total_ratings": 42, "availability": True,
            "location": "HSR Layout, Bengaluru", "latitude": 12.9116, "longitude": 77.6370,
            "verification_status": "pending", "active_jobs": 0, "completed_jobs": 28, "earnings": 21500.0,
            "service_radius_km": 15.0, "emergency_available": False,
            "skills": [
                {"id": "sk-7", "serviceId": "svc-4", "serviceName": "Painter"},
            ]
        },
        {
            "id": "wkr-5", "user_id": "usr-worker-5", "cooperative_id": "coop-3",
            "experience": 6, "rating": 4.5, "total_ratings": 98, "availability": True,
            "location": "Marathahalli, Bengaluru", "latitude": 12.9591, "longitude": 77.6971,
            "verification_status": "verified", "active_jobs": 1, "completed_jobs": 112, "earnings": 89000.0,
            "service_radius_km": 30.0, "emergency_available": True,
            "skills": [
                {"id": "sk-8", "serviceId": "svc-6", "serviceName": "Gardener"},
                {"id": "sk-9", "serviceId": "svc-8", "serviceName": "Caregiver"},
            ]
        },
    ]

    for w_info in workers_data:
        if not db.query(Worker).filter(Worker.id == w_info["id"]).first():
            worker = Worker(
                id=w_info["id"],
                user_id=w_info["user_id"],
                cooperative_id=w_info["cooperative_id"],
                experience=w_info["experience"],
                rating=w_info["rating"],
                total_ratings=w_info["total_ratings"],
                availability=w_info["availability"],
                location=w_info["location"],
                latitude=w_info["latitude"],
                longitude=w_info["longitude"],
                verification_status=w_info["verification_status"],
                active_jobs=w_info["active_jobs"],
                completed_jobs=w_info["completed_jobs"],
                earnings=w_info["earnings"],
                service_radius_km=w_info["service_radius_km"],
                emergency_available=w_info["emergency_available"],
                skills=w_info["skills"],
                schedule=default_schedule,
            )
            db.add(worker)
    db.commit()
    print("  [OK] Demo Workers (5 profiles)")

    # 6. Bookings
    bookings_data = [
        {
            "id": "bkg-1", "customer_id": "usr-customer-1", "worker_id": "wkr-1", "service_id": "svc-1",
            "description": "Power socket not working in the living room, need urgent fix.",
            "location": "12, MG Road, Bengaluru 560001", "latitude": 12.9762, "longitude": 77.6033,
            "preferred_date": "2026-10-25", "preferred_time": "10:00", "emergency": False,
            "status": "accepted", "notes": "Please bring socket tester."
        },
        {
            "id": "bkg-2", "customer_id": "usr-customer-1", "worker_id": None, "service_id": "svc-2",
            "description": "Kitchen tap leaking continuously.",
            "location": "12, MG Road, Bengaluru 560001", "latitude": 12.9762, "longitude": 77.6033,
            "preferred_date": "2026-10-26", "preferred_time": "14:00", "emergency": True,
            "status": "pending", "notes": None
        },
        {
            "id": "bkg-3", "customer_id": "usr-customer-1", "worker_id": "wkr-2", "service_id": "svc-5",
            "description": "Deep cleaning of 3BHK apartment.",
            "location": "12, MG Road, Bengaluru 560001", "latitude": 12.9762, "longitude": 77.6033,
            "preferred_date": "2026-10-10", "preferred_time": "09:00", "emergency": False,
            "status": "completed", "notes": "Living room and kitchen focus."
        },
        {
            "id": "bkg-4", "customer_id": "usr-customer-2", "worker_id": "wkr-1", "service_id": "svc-10",
            "description": "Washing machine making loud vibration noise.",
            "location": "45, Whitefield Main Road, Bengaluru", "latitude": 12.9698, "longitude": 77.7499,
            "preferred_date": "2026-10-24", "preferred_time": "11:00", "emergency": False,
            "status": "in_progress", "notes": "Front-loading machine."
        },
        {
            "id": "bkg-5", "customer_id": "usr-customer-1", "worker_id": None, "service_id": "svc-4",
            "description": "Paint entire 2BHK flat – walls & ceiling.",
            "location": "12, MG Road, Bengaluru 560001", "latitude": 12.9762, "longitude": 77.6033,
            "preferred_date": "2026-10-05", "preferred_time": "08:00", "emergency": False,
            "status": "cancelled", "notes": "Cancelled – rescheduled for next month."
        },
    ]

    for b_info in bookings_data:
        if not db.query(Booking).filter(Booking.id == b_info["id"]).first():
            b = Booking(
                id=b_info["id"],
                customer_id=b_info["customer_id"],
                worker_id=b_info["worker_id"],
                service_id=b_info["service_id"],
                description=b_info["description"],
                location=b_info["location"],
                latitude=b_info["latitude"],
                longitude=b_info["longitude"],
                preferred_date=b_info["preferred_date"],
                preferred_time=b_info["preferred_time"],
                emergency=b_info["emergency"],
                status=b_info["status"],
                notes=b_info["notes"],
            )
            db.add(b)
    db.commit()
    print("  [OK] Demo Bookings (5 bookings across various statuses)")

    # 7. Ratings
    if not db.query(Rating).filter(Rating.id == "rat-1").first():
        rating = Rating(
            id="rat-1",
            booking_id="bkg-3",
            customer_id="usr-customer-1",
            worker_id="wkr-2",
            overall=4,
            work_quality=4,
            punctuality=5,
            behaviour=5,
            professionalism=4,
            review="Very thorough cleaning job. Arrived on time and was polite."
        )
        db.add(rating)
        db.commit()
        print("  [OK] Demo Ratings")

    # 8. Complaints
    if not db.query(Complaint).filter(Complaint.id == "cmp-1").first():
        c1 = Complaint(
            id="cmp-1",
            booking_id="bkg-5",
            customer_id="usr-customer-1",
            category="worker_no_show",
            description="The assigned worker never showed up on the scheduled date.",
            status="resolved",
            resolution_note="Worker account reviewed. Apology issued and rescheduled."
        )
        db.add(c1)

    if not db.query(Complaint).filter(Complaint.id == "cmp-2").first():
        c2 = Complaint(
            id="cmp-2",
            booking_id="bkg-4",
            customer_id="usr-customer-2",
            category="overcharging",
            description="Worker requested extra charges beyond the standard catalogue rate.",
            status="under_review",
            resolution_note=None
        )
        db.add(c2)
    db.commit()
    print("  [OK] Demo Complaints")

    # 9. Notifications
    notifs_data = [
        {
            "id": "ntf-1", "user_id": "usr-customer-1", "type": "worker_assigned",
            "title": "Worker Assigned", "body": "Ravi Kumar has received your electrician booking.",
            "data": {"bookingId": "bkg-1"}, "read": False
        },
        {
            "id": "ntf-2", "user_id": "usr-customer-1", "type": "booking_accepted",
            "title": "Booking Accepted", "body": "Ravi Kumar accepted your service booking.",
            "data": {"bookingId": "bkg-1"}, "read": False
        },
        {
            "id": "ntf-3", "user_id": "usr-worker-1", "type": "new_job_request",
            "title": "New Service Request", "body": "Electrician request at 12, MG Road.",
            "data": {"bookingId": "bkg-1"}, "read": True
        },
        {
            "id": "ntf-4", "user_id": "usr-worker-2", "type": "verification_update",
            "title": "Verification Approved", "body": "Your worker profile has been verified.",
            "data": {}, "read": True
        },
    ]

    for n_info in notifs_data:
        if not db.query(Notification).filter(Notification.id == n_info["id"]).first():
            n = Notification(
                id=n_info["id"],
                user_id=n_info["user_id"],
                type=n_info["type"],
                title=n_info["title"],
                body=n_info["body"],
                data=n_info["data"],
                read=n_info["read"],
            )
            db.add(n)
    db.commit()
    print("  [OK] Demo Notifications")

    print("\n" + "=" * 60)
    print("  Seed complete! Ready for standalone development.")
    print("  All demo accounts password: password123 (or demo123)")
    print("  - Admin:    admin@coopconnect.in")
    print("  - Customer: customer@coopconnect.in")
    print("  - Worker:   worker@coopconnect.in")
    print("  - Worker 2: sita@coopconnect.in")
    print("=" * 60 + "\n")

if __name__ == "__main__":
    try:
        seed()
    finally:
        db.close()
