"""
Database Migration: Add Mandatory ₹100 Booking Charge & Financial Snapshot Fields
================================================================================
Adds columns for:
- service_fee (Float)
- booking_charge (Float)
- total_amount (Float)
- service_fee_paise (Integer)
- booking_charge_paise (Integer)
- total_amount_paise (Integer)
- payment_method (String)
- payment_status (String)

Safely preserves historical booking amounts without silently adding charges to past bookings.
Works across PostgreSQL and SQLite.
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import inspect, text
from app.database import engine, SessionLocal
from app.models.booking import Booking
from app.models.service import Service

def run_migration():
    print("=" * 60)
    print("  Sevai One Database Migration: Booking Charges & Financial Snapshot")
    print("=" * 60)

    inspector = inspect(engine)
    existing_columns = [c["name"] for c in inspector.get_columns("bookings")]

    columns_to_add = [
        ("service_fee", "FLOAT"),
        ("booking_charge", "FLOAT DEFAULT 100.0"),
        ("total_amount", "FLOAT"),
        ("service_fee_paise", "INTEGER"),
        ("booking_charge_paise", "INTEGER DEFAULT 10000"),
        ("total_amount_paise", "INTEGER"),
        ("payment_method", "VARCHAR DEFAULT 'cash'"),
        ("payment_status", "VARCHAR DEFAULT 'pending'"),
    ]

    with engine.begin() as conn:
        for col_name, col_type in columns_to_add:
            if col_name not in existing_columns:
                print(f"  [+] Adding column '{col_name}' ({col_type}) to 'bookings' table...")
                conn.execute(text(f"ALTER TABLE bookings ADD COLUMN {col_name} {col_type}"))
            else:
                print(f"  [OK] Column '{col_name}' already exists.")

    # Populate historical bookings without retroactive charges
    db = SessionLocal()
    try:
        historical_bookings = db.query(Booking).filter(Booking.total_amount.is_(None)).all()
        print(f"  [*] Checking historical bookings for financial initialization: {len(historical_bookings)} found.")

        for b in historical_bookings:
            service = db.query(Service).filter(Service.id == b.service_id).first()
            base_fee = float(str(service.base_price)) if service and service.base_price else 300.0
            
            # Historical bookings preserve original amounts with 0.0 legacy booking charge
            # pyrefly: ignore[bad-assignment]
            b.service_fee = base_fee
            b.booking_charge = 0.0
            b.total_amount = base_fee
            # pyrefly: ignore[bad-assignment]
            b.service_fee_paise = int(round(base_fee * 100))
            b.booking_charge_paise = 0
            b.total_amount_paise = b.service_fee_paise
            b.payment_method = "cash"
            b.payment_status = "paid" if b.status == "completed" else "pending"

        db.commit()
        print(f"  [OK] Successfully migrated {len(historical_bookings)} historical bookings with preserved amounts.")
    finally:
        db.close()

    print("=" * 60)
    print("  Migration Complete!")
    print("=" * 60)

if __name__ == "__main__":
    run_migration()
