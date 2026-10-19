# CoopConnect – Cooperative Gig Services Platform

CoopConnect is a full-stack platform connecting customers with skilled cooperative workers (electricians, plumbers, carpenters, cleaners, etc.).

The project is organized into two completely decoupled, standalone packages:

```
Cooperative-gig-service/
├── backend/    # FastAPI + SQLAlchemy Python Server
└── frontend/   # React Native + Expo Mobile Application
```

---

## Architecture Overview

* **`backend/`**: Standalone REST API built with **FastAPI**, **SQLAlchemy**, and **Pydantic**.
  * Complete auth system (bcrypt password hashing, JWT tokens, RBAC for Customer, Worker, Admin).
  * Cooperative management, service catalogue, worker verification, and dynamic shift availability.
  * Deterministic matching engine (skills, radius, workload, schedule fit, and fairness weighting).
  * State-machine governed booking lifecycle (`pending` → `worker_assigned` → `accepted` → `in_progress` → `completed`).
  * Real-time in-app notifications, customer reviews, and grievance/complaint resolution.
  * SQLite database with zero setup required (`coopconnect.db`).
* **`frontend/`**: Mobile app built with **Expo SDK 53**, **React Native**, **TypeScript**, and **Expo Router**.
  * Cross-platform UI (Android, iOS, Web) following authentic cooperative gig service design tokens.
  * Automatic dual-mode operation: calls the live FastAPI backend when running, and seamlessly falls back to offline mock mode if running detached.

---

## Quick Start

### 1. Running the Backend Server
```powershell
cd backend

# Activate virtual environment
.\venv\Scripts\activate

# Seed initial demo data (users, workers, services, bookings)
python seed.py

# Start the FastAPI server (runs on http://localhost:8000)
python run.py

# (Optional) Run automated backend smoke tests (35/35 passing)
python test_api.py
```
* **Swagger API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
* **ReDoc Documentation**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

### 2. Running the Mobile Frontend
```powershell
cd frontend

# Start the Expo development server & Metro bundler
npm start

# Run on Android device / emulator
npm run android

# Run in Web browser
npm run web

# Run frontend tests
npm test
```

---

### 3. Monorepo Scripts (from the Root Directory)
You can also run commands directly from the root project folder:
* **Start Frontend**: `npm run start:frontend`
* **Start Backend**: `npm run start:backend`
* **Test Frontend**: `npm run test:frontend`
* **Test Backend**: `npm run test:backend`

---

## Demo Accounts

All demo accounts use password: `password123` (or `demo123`).

| Role     | Name           | Email                     | Description / Permissions                        |
|----------|----------------|---------------------------|--------------------------------------------------|
| Admin    | Kavya Reddy    | `admin@coopconnect.in`    | Full platform dashboard, worker verification     |
| Customer | Arjun Sharma   | `customer@coopconnect.in` | Standard customer with active service bookings   |
| Customer | Deepa Menon    | `deepa@coopconnect.in`    | Secondary customer with in-progress booking      |
| Worker   | Ravi Kumar     | `worker@coopconnect.in`   | Electrician & Technician (`wkr-1`, 4.7★)         |
| Worker   | Sita Devi      | `sita@coopconnect.in`     | Cleaner & Domestic Helper (`wkr-2`, 4.3★)        |
| Worker   | Mohan Das      | `mohan@coopconnect.in`    | Plumber & Carpenter (`wkr-3`, 4.9★)             |
| Worker   | Priya Patel    | `priya@coopconnect.in`    | Painter (`wkr-4`, 4.1★, pending verification)     |
| Worker   | Suresh Naidu   | `suresh@coopconnect.in`   | Gardener & Caregiver (`wkr-5`, 4.5★)             |