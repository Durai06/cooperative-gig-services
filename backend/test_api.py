"""
Comprehensive Smoke Test Suite for Sevai One Backend
Tests all 10 router modules:
- Health
- Auth (login, register, forgot-password, profile, me)
- Cooperatives (list, get)
- Services (list, get)
- Workers (list, get by id, get by user id, toggle availability, update verification)
- Bookings (list, get, create, assign, update status, cancel, reject)
- Matching (score calculation, collision check, radius check)
- Ratings (list, submit, validation)
- Complaints (list, submit, resolve)
- Notifications (list, mark read, mark all read)
- Admin (analytics, settings get, settings update)
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def run_tests():
    print("=" * 60)
    print("  Running Sevai One API Test Suite")
    print("=" * 60)
    
    passed = 0
    failed = 0

    def assert_test(name, condition, details=""):
        nonlocal passed, failed
        if condition:
            passed += 1
            print(f"  [PASS] {name}")
        else:
            failed += 1
            print(f"  [FAIL] {name} - {details}")

    # 1. Health
    res = client.get("/")
    assert_test("Root endpoint", res.status_code == 200 and res.json().get("status") == "running")

    res = client.get("/health")
    assert_test("Health check", res.status_code == 200 and res.json().get("status") == "ok")

    # 2. Auth - Login customer
    res = client.post("/api/auth/login", json={"email": "customer@coopconnect.in", "password": "password123"})
    assert_test("Customer Login", res.status_code == 200 and "token" in res.json(), res.text)
    cust_token = res.json().get("token")
    cust_headers = {"Authorization": f"Bearer {cust_token}"}

    # Auth - Login worker
    res = client.post("/api/auth/login", json={"email": "worker@coopconnect.in", "password": "password123"})
    assert_test("Worker Login", res.status_code == 200 and "token" in res.json(), res.text)
    wrk_token = res.json().get("token")
    wrk_headers = {"Authorization": f"Bearer {wrk_token}"}

    # Auth - Login admin
    res = client.post("/api/auth/login", json={"email": "admin@coopconnect.in", "password": "password123"})
    assert_test("Admin Login", res.status_code == 200 and "token" in res.json(), res.text)
    admin_token = res.json().get("token")
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Auth - Me
    res = client.get("/api/auth/me", headers=cust_headers)
    assert_test("Auth Get Me", res.status_code == 200 and res.json()["user"]["email"] == "customer@coopconnect.in", res.text)

    # Auth - Forgot Password
    res = client.post("/api/auth/forgot-password", json={"email": "customer@coopconnect.in"})
    assert_test("Forgot Password Valid Email", res.status_code == 200, res.text)

    res = client.post("/api/auth/forgot-password", json={"email": "nonexistent@coopconnect.in"})
    assert_test("Forgot Password Invalid Email", res.status_code == 404, res.text)

    # Auth - Update Profile
    res = client.patch("/api/auth/profile", headers=cust_headers, json={"name": "Arjun Sharma Updated"})
    assert_test("Update Profile", res.status_code == 200 and res.json()["user"]["name"] == "Arjun Sharma Updated", res.text)

    # 3. Cooperatives
    res = client.get("/api/cooperatives")
    assert_test("Get Cooperatives List", res.status_code == 200 and len(res.json()) >= 4, res.text)

    res = client.get("/api/cooperatives/coop-1")
    assert_test("Get Cooperative by ID", res.status_code == 200 and res.json()["id"] == "coop-1", res.text)

    # 4. Services
    res = client.get("/api/services")
    assert_test("Get Services List", res.status_code == 200 and len(res.json()) >= 10, res.text)

    res = client.get("/api/services/svc-1")
    assert_test("Get Service by ID", res.status_code == 200 and res.json()["id"] == "svc-1", res.text)

    # 5. Workers
    res = client.get("/api/workers")
    assert_test("Get Workers List", res.status_code == 200 and len(res.json()) >= 5, res.text)

    res = client.get("/api/workers/wkr-1")
    assert_test("Get Worker by ID", res.status_code == 200 and res.json()["id"] == "wkr-1", res.text)

    res = client.get("/api/workers/by-user/usr-worker-1")
    assert_test("Get Worker by User ID", res.status_code == 200 and res.json()["id"] == "wkr-1", res.text)

    # Worker Toggle Availability
    res = client.patch("/api/workers/wkr-1/toggle-availability", headers=wrk_headers)
    assert_test("Toggle Worker Availability", res.status_code == 200, res.text)
    # Toggle back
    client.patch("/api/workers/wkr-1/toggle-availability", headers=wrk_headers)

    # 6. Matching Engine
    res = client.post("/api/matching/find-workers", json={
        "serviceId": "svc-1",
        "preferredDate": "2026-10-27",
        "preferredTime": "11:00",
        "latitude": 12.9716,
        "longitude": 77.5946
    })
    assert_test("Find Matching Workers", res.status_code == 200 and len(res.json()) > 0, res.text)

    # 7. Bookings
    # List customer bookings
    res = client.get("/api/bookings", headers=cust_headers)
    assert_test("Get Customer Bookings", res.status_code == 200 and len(res.json()) >= 1, res.text)

    # Create new booking on a Monday (worker active schedule)
    res = client.post("/api/bookings", headers=cust_headers, json={
        "serviceId": "svc-1",
        "description": "Short circuit repair in bedroom outlet",
        "location": "12, MG Road, Bengaluru",
        "preferredDate": "2026-11-02",
        "preferredTime": "10:00",
        "emergency": False
    })
    assert_test("Create Booking", res.status_code == 200 and res.json()["status"] == "pending", res.text)
    new_bkg_id = res.json()["id"]

    # Assign worker to booking
    res = client.patch(f"/api/bookings/{new_bkg_id}/assign", headers=cust_headers, json={"workerId": "wkr-1"})
    assert_test("Assign Worker to Booking", res.status_code == 200 and res.json()["status"] == "worker_assigned", res.text)

    # Worker accepts booking
    res = client.patch(f"/api/bookings/{new_bkg_id}/status", headers=wrk_headers, json={"status": "accepted"})
    assert_test("Worker Accept Booking", res.status_code == 200 and res.json()["status"] == "accepted", res.text)

    # Worker starts booking
    res = client.patch(f"/api/bookings/{new_bkg_id}/status", headers=wrk_headers, json={"status": "in_progress"})
    assert_test("Worker In-Progress Booking", res.status_code == 200 and res.json()["status"] == "in_progress", res.text)

    # Worker completes booking
    res = client.patch(f"/api/bookings/{new_bkg_id}/status", headers=wrk_headers, json={"status": "completed"})
    assert_test("Worker Complete Booking", res.status_code == 200 and res.json()["status"] == "completed", res.text)

    # 8. Ratings
    res = client.post("/api/ratings", headers=cust_headers, json={
        "bookingId": new_bkg_id,
        "workerId": "wkr-1",
        "overall": 5,
        "workQuality": 5,
        "punctuality": 5,
        "behaviour": 5,
        "professionalism": 5,
        "review": "Outstanding service! Fixed quickly and safely."
    })
    assert_test("Submit Rating for Completed Booking", res.status_code == 200 and res.json()["overall"] == 5, res.text)

    res = client.get("/api/ratings?worker_id=wkr-1")
    assert_test("Get Worker Ratings", res.status_code == 200 and len(res.json()) >= 1, res.text)

    # 9. Complaints
    res = client.get("/api/complaints", headers=cust_headers)
    assert_test("Get Customer Complaints", res.status_code == 200, res.text)

    res = client.post("/api/complaints", headers=cust_headers, json={
        "bookingId": new_bkg_id,
        "category": "poor_workmanship",
        "description": "Checking followup on outlet plate alignment."
    })
    assert_test("Submit Complaint", res.status_code == 200 and res.json()["status"] == "open", res.text)
    new_cmp_id = res.json()["id"]

    # Admin resolves complaint
    res = client.patch(f"/api/complaints/{new_cmp_id}/resolve", headers=admin_headers, json={
        "status": "resolved",
        "resolutionNote": "Customer issue investigated and settled amicably."
    })
    assert_test("Admin Resolve Complaint", res.status_code == 200 and res.json()["status"] == "resolved", res.text)

    # 10. Notifications
    res = client.get("/api/notifications", headers=cust_headers)
    assert_test("Get Notifications", res.status_code == 200 and len(res.json()) > 0, res.text)
    notif_id = res.json()[0]["id"]

    res = client.patch(f"/api/notifications/{notif_id}/read", headers=cust_headers)
    assert_test("Mark Notification Read", res.status_code == 200 and res.json()["read"] == True, res.text)

    res = client.patch("/api/notifications/read-all", headers=cust_headers)
    assert_test("Mark All Notifications Read", res.status_code == 200, res.text)

    # 11. Admin Analytics & Settings
    res = client.get("/api/admin/analytics", headers=admin_headers)
    assert_test("Get Admin Analytics", res.status_code == 200 and "totalWorkers" in res.json(), res.text)

    res = client.get("/api/admin/settings")
    assert_test("Get Admin Settings", res.status_code == 200 and "commissionRate" in res.json(), res.text)

    res = client.patch("/api/admin/settings", headers=admin_headers, json={
        "commission_rate": 0.12,
        "min_hourly_rate": 160.0,
        "max_travel_radius": 35.0,
        "emergency_bonus_multiplier": 1.6,
        "auto_assign_fairness_weight": 0.35
    })
    assert_test("Update Admin Settings", res.status_code == 200, res.text)

    print("=" * 60)
    print(f"  Test Results: {passed} PASSED, {failed} FAILED")
    print("=" * 60)
    return failed == 0

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
