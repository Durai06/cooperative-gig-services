"""
Seed script – populates the DB with demo cooperatives, services, users and workers.
Run once after creating the database:
    cd backend
    .\\venv\\Scripts\\python seed.py
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.database import engine, SessionLocal
from app.models import (
    User, Cooperative, Service, Worker,
    CooperativeSettings, Notification
)
from app.core.security import get_password_hash
from app.database import Base

Base.metadata.create_all(bind=engine)

db = SessionLocal()

def seed():
    print("Seeding database...")

    # -- Settings
    if not db.query(CooperativeSettings).first():
        db.add(CooperativeSettings())
        db.commit()
        print("  ✓ Cooperative settings")

    # -- Cooperatives
    if db.query(Cooperative).count() == 0:
        coops = [
            Cooperative(id="coop-1", name="Bengaluru Labour Cooperative", location="Bengaluru, Karnataka", contact="+91 80 4567 8901"),
            Cooperative(id="coop-2", name="Mumbai Workers Union Coop",    location="Mumbai, Maharashtra",  contact="+91 22 1234 5678"),
            Cooperative(id="coop-3", name="Delhi Skilled Workers Society", location="New Delhi",           contact="+91 11 9876 5432"),
            Cooperative(id="coop-4", name="Chennai Service Cooperative",   location="Chennai, Tamil Nadu", contact="+91 44 7654 3210"),
        ]
        db.add_all(coops)
        db.commit()
        print("  ✓ Cooperatives")

    # -- Services
    if db.query(Service).count() == 0:
        services = [
            Service(id="svc-1",  name="Electrician",    description="Wiring, repairs & installations",  base_price=350, icon="zap",        category="electrician"),
            Service(id="svc-2",  name="Plumber",        description="Pipes, drains & fixtures",          base_price=300, icon="droplets",   category="plumber"),
            Service(id="svc-3",  name="Carpenter",      description="Furniture & woodwork",              base_price=400, icon="hammer",     category="carpenter"),
            Service(id="svc-4",  name="Painter",        description="Interior & exterior painting",      base_price=450, icon="paintbrush", category="painter"),
            Service(id="svc-5",  name="Housekeeper",    description="Deep cleaning & home maintenance",  base_price=250, icon="home",       category="housekeeping"),
            Service(id="svc-6",  name="AC Technician",  description="AC installation, service & repair", base_price=500, icon="wind",       category="ac_technician"),
            Service(id="svc-7",  name="Gardener",       description="Lawn care & landscaping",           base_price=200, icon="leaf",       category="gardener"),
            Service(id="svc-8",  name="Security Guard", description="Premises & event security",         base_price=600, icon="shield",     category="security"),
            Service(id="svc-9",  name="Driver",         description="Personal & commercial driving",     base_price=300, icon="car",        category="driver"),
            Service(id="svc-10", name="Cook",           description="Meal preparation & catering",       base_price=280, icon="utensils",   category="cook"),
        ]
        db.add_all(services)
        db.commit()
        print("  ✓ Services")

    # -- Demo Users
    demo_pwd = get_password_hash("demo123")

    if not db.query(User).filter(User.email == "customer@coopconnect.in").first():
        cust = User(id="user-cust-1", name="Priya Sharma", email="customer@coopconnect.in",
                    phone="+91 98765 43210", password_hash=demo_pwd, role="customer",
                    address="12 MG Road, Bengaluru, Karnataka")
        db.add(cust)
        db.commit()
        print("  ✓ Demo customer")

    if not db.query(User).filter(User.email == "worker@coopconnect.in").first():
        wrk_user = User(id="user-wrk-1", name="Ravi Kumar", email="worker@coopconnect.in",
                        phone="+91 87654 32109", password_hash=demo_pwd, role="worker",
                        address="45 Indiranagar, Bengaluru, Karnataka")
        db.add(wrk_user)
        db.flush()
        worker = Worker(
            id="wrk-1",
            user_id=wrk_user.id,
            cooperative_id="coop-1",
            experience=5,
            rating=4.7,
            total_ratings=23,
            availability=True,
            location="Bengaluru, Karnataka",
            latitude=12.9716,
            longitude=77.5946,
            verification_status="verified",
            active_jobs=1,
            completed_jobs=47,
            earnings=14200.0,
            service_radius_km=15.0,
            emergency_available=True,
            skills=[
                {"id": "sk-1", "workerId": "wrk-1", "serviceId": "svc-1", "serviceName": "Electrician"},
                {"id": "sk-2", "workerId": "wrk-1", "serviceId": "svc-6", "serviceName": "AC Technician"},
            ],
            schedule=[
                {"day": "Monday",    "enabled": True,  "shift": "09:00-18:00"},
                {"day": "Tuesday",   "enabled": True,  "shift": "09:00-18:00"},
                {"day": "Wednesday", "enabled": True,  "shift": "09:00-18:00"},
                {"day": "Thursday",  "enabled": True,  "shift": "09:00-18:00"},
                {"day": "Friday",    "enabled": True,  "shift": "09:00-18:00"},
                {"day": "Saturday",  "enabled": True,  "shift": "10:00-15:00"},
                {"day": "Sunday",    "enabled": False, "shift": "09:00-18:00"},
            ]
        )
        db.add(worker)
        db.commit()
        print("  ✓ Demo worker")

    if not db.query(User).filter(User.email == "admin@coopconnect.in").first():
        admin = User(id="user-admin-1", name="Administrator", email="admin@coopconnect.in",
                     phone="+91 11111 11111", password_hash=demo_pwd, role="admin",
                     address="CoopConnect HQ, Bengaluru")
        db.add(admin)
        db.commit()
        print("  ✓ Demo admin")

    print("\nSeed complete! Demo accounts:")
    print("  customer@coopconnect.in  / demo123  (role: customer)")
    print("  worker@coopconnect.in    / demo123  (role: worker)")
    print("  admin@coopconnect.in     / demo123  (role: admin)")

if __name__ == "__main__":
    try:
        seed()
    finally:
        db.close()
