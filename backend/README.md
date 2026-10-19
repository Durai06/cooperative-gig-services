# CoopConnect Backend

FastAPI + SQLAlchemy backend for the CoopConnect cooperative gig services platform.

## Setup

### 1. Create a virtual environment
```bash
cd backend
python -m venv venv
```

### 2. Activate the virtual environment
- **Windows:** `.\venv\Scripts\activate`
- **Mac/Linux:** `source venv/bin/activate`

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure environment
```bash
copy .env.example .env
```
Edit `.env` to set your `DATABASE_URL` and `SECRET_KEY`.

- **SQLite (default, zero setup):** `DATABASE_URL=sqlite:///./coopconnect.db`
- **PostgreSQL:** `DATABASE_URL=postgresql://user:password@localhost:5432/coopconnect`

### 5. Seed the database with demo data
```bash
python seed.py
```

### 6. Run the server
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API is now available at: **http://localhost:8000**  
Interactive API docs (Swagger UI): **http://localhost:8000/docs**

---

## Demo Accounts (created by seed.py)

| Role     | Email                     | Password  |
|----------|---------------------------|-----------|
| Customer | customer@coopconnect.in   | demo123   |
| Worker   | worker@coopconnect.in     | demo123   |
| Admin    | admin@coopconnect.in      | demo123   |

---

## API Endpoints

| Method | Path                                | Auth    | Description                           |
|--------|-------------------------------------|---------|---------------------------------------|
| POST   | `/api/auth/login`                   | Public  | Login and receive JWT token           |
| POST   | `/api/auth/register-customer`       | Public  | Register customer account             |
| POST   | `/api/auth/register-worker`         | Public  | Register worker account               |
| GET    | `/api/auth/me`                      | Bearer  | Get current user profile              |
| GET    | `/api/services`                     | Public  | List all services                     |
| GET    | `/api/services/{id}`                | Public  | Get a single service                  |
| GET    | `/api/workers`                      | Bearer  | List workers (with filters)           |
| GET    | `/api/workers/{id}`                 | Bearer  | Get worker by ID                      |
| PATCH  | `/api/workers/{id}/availability`    | Bearer  | Update worker availability/schedule   |
| PATCH  | `/api/workers/{id}/verify`          | Admin   | Verify/reject a worker                |
| POST   | `/api/matching/find-workers`        | Public  | Find matched workers for a booking    |
| GET    | `/api/bookings`                     | Bearer  | List bookings (role-filtered)         |
| GET    | `/api/bookings/{id}`                | Bearer  | Get booking details                   |
| POST   | `/api/bookings`                     | Bearer  | Create a new booking                  |
| PATCH  | `/api/bookings/{id}/status`         | Bearer  | Update booking status                 |
| GET    | `/api/ratings`                      | Bearer  | Get ratings (filter by worker/booking)|
| POST   | `/api/ratings`                      | Bearer  | Submit a rating                       |
| GET    | `/api/complaints`                   | Bearer  | List complaints                       |
| POST   | `/api/complaints`                   | Bearer  | Submit a complaint                    |
| PATCH  | `/api/complaints/{id}/resolve`      | Admin   | Resolve a complaint                   |
| GET    | `/api/notifications`                | Bearer  | Get notifications for current user    |
| PATCH  | `/api/notifications/{id}/read`      | Bearer  | Mark notification as read             |
| PATCH  | `/api/notifications/read-all`       | Bearer  | Mark all notifications read           |
| GET    | `/api/admin/analytics`              | Admin   | Dashboard analytics summary           |
| GET    | `/api/admin/settings`               | Public  | Get cooperative settings              |
| PATCH  | `/api/admin/settings`               | Admin   | Update cooperative settings           |

---

## Connecting the Expo App

In the React Native frontend, set `EXPO_PUBLIC_API_URL` in your `.env`:
```
EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:8000/api
```
Replace `YOUR_LOCAL_IP` with your computer's local network IP (e.g. `192.168.1.10`) so your Android device can reach it.
