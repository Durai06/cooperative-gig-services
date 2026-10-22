# Sevai One Standalone Backend Server

Production-grade, standalone FastAPI + SQLAlchemy backend for the **Sevai One** cooperative gig services platform.

---

## Quick Start (Standalone Runner)

### 1. Setup Virtual Environment & Install Dependencies
```bash
cd backend
python -m venv venv

# Windows
.\venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
```

### 2. Configure Environment
```bash
# Windows
copy .env.example .env

# macOS / Linux
cp .env.example .env
```
Default `.env` settings:
- **SQLite Database:** `sqlite:///./coopconnect.db` (zero-configuration, persistent local file)
- **JWT Key:** Pre-configured development secret key
- **Host & Port:** `0.0.0.0:8000`

### 3. Seed Database with Complete Demo Data
```bash
python seed.py
```
This populates:
- 4 Cooperatives across major metros (Bengaluru, Mumbai, Delhi, Chennai)
- 10 Service Categories (Electrician, Plumber, Carpenter, Painter, Cleaner, etc.)
- 8 Users with pre-hashed credentials (Admin, 2 Customers, 5 Workers)
- 5 Verified Worker Profiles with full shift schedules, service radius, and skill sets
- 5 Live Bookings across all state-machine stages (pending, assigned, accepted, in-progress, completed)
- Real ratings, complaints, and notifications

### 4. Start the Standalone Server
```bash
python run.py
```
Or with custom host/port:
```bash
python run.py --host 127.0.0.1 --port 8000
```
- **Service Root:** `http://localhost:8000/`
- **Interactive OpenAPI Documentation (Swagger UI):** `http://localhost:8000/docs`
- **ReDoc Alternative Documentation:** `http://localhost:8000/redoc`

### 5. Run Automated Smoke Test Suite
```bash
python test_api.py
```
Executes 35 automated tests verifying all endpoints, auth token generation, role guards, transitions, and matching logic.

---

## Demo Accounts

All demo accounts use password: `password123` (or `demo123`).

| Role     | Name           | Email                     | Assigned Profile / Description                     |
|----------|----------------|---------------------------|----------------------------------------------------|
| Admin    | Kavya Reddy    | `admin@coopconnect.in`    | Full platform analytics & settings management     |
| Customer | Arjun Sharma   | `customer@coopconnect.in` | Standard customer with active and past bookings    |
| Customer | Deepa Menon    | `deepa@coopconnect.in`    | Secondary customer with in-progress service        |
| Worker   | Ravi Kumar     | `worker@coopconnect.in`   | Electrician & Technician (`wkr-1`, 4.7★, 124 jobs) |
| Worker   | Sita Devi      | `sita@coopconnect.in`     | Cleaner & Domestic Helper (`wkr-2`, 4.3★, 87 jobs) |
| Worker   | Mohan Das      | `mohan@coopconnect.in`    | Plumber & Carpenter (`wkr-3`, 4.9★, 213 jobs)      |
| Worker   | Priya Patel    | `priya@coopconnect.in`    | Painter (`wkr-4`, 4.1★, pending verification)      |
| Worker   | Suresh Naidu   | `suresh@coopconnect.in`   | Gardener & Caregiver (`wkr-5`, 4.5★, 98 jobs)      |

---

## API Endpoints Reference

### Authentication (`/api/auth`)
| Method | Path                       | Auth   | Description                                       |
|--------|----------------------------|--------|---------------------------------------------------|
| `POST` | `/api/auth/login`          | Public | Authenticate user, receive JWT token & profile    |
| `POST` | `/api/auth/register-customer` | Public | Register new customer account                  |
| `POST` | `/api/auth/register-worker`   | Public | Register new worker with skills & cooperative     |
| `POST` | `/api/auth/forgot-password`   | Public | Validate email & dispatch reset instructions      |
| `GET`  | `/api/auth/me`             | Bearer | Retrieve profile for authenticated user           |
| `PATCH`| `/api/auth/profile`        | Bearer | Update user profile (name, phone, address, avatar)|

### Cooperatives (`/api/cooperatives`)
| Method | Path                       | Auth   | Description                                       |
|--------|----------------------------|--------|---------------------------------------------------|
| `GET`  | `/api/cooperatives`        | Public | List all cooperatives (supports `?search=` filter)|
| `GET`  | `/api/cooperatives/{id}`   | Public | Get single cooperative details                    |
| `POST` | `/api/cooperatives`        | Admin  | Register a new cooperative                        |

### Service Catalogue (`/api/services`)
| Method | Path                       | Auth   | Description                                       |
|--------|----------------------------|--------|---------------------------------------------------|
| `GET`  | `/api/services`            | Public | List services (supports `?category=` filter)      |
| `GET`  | `/api/services/{id}`       | Public | Get single service details & base price           |
| `POST` | `/api/services`            | Admin  | Create a new service offering                     |

### Worker Management (`/api/workers`)
| Method | Path                                   | Auth   | Description                                       |
|--------|----------------------------------------|--------|---------------------------------------------------|
| `GET`  | `/api/workers`                         | Public | List workers (filter by status, service, avail)   |
| `GET`  | `/api/workers/{id}`                    | Public | Get worker by Worker ID                           |
| `GET`  | `/api/workers/by-user/{user_id}`       | Public | Get worker profile by User ID                     |
| `PATCH`| `/api/workers/{id}/availability`       | Worker | Update weekly schedule, radius, emergency flag    |
| `PATCH`| `/api/workers/{id}/toggle-availability`| Worker | Quick toggle active availability on/off           |
| `PATCH`| `/api/workers/{id}/verify`             | Admin  | Update verification status (verified/rejected)    |

### Matching Engine (`/api/matching`)
| Method | Path                       | Auth   | Description                                       |
|--------|----------------------------|--------|---------------------------------------------------|
| `POST` | `/api/matching/find-workers`| Public | Score and rank workers for booking requirements   |

### Booking Lifecycle (`/api/bookings`)
| Method | Path                       | Auth   | Description                                       |
|--------|----------------------------|--------|---------------------------------------------------|
| `GET`  | `/api/bookings`            | Bearer | List bookings (scoped by Customer/Worker/Admin)   |
| `GET`  | `/api/bookings/{id}`       | Bearer | Get full booking details with service & parties   |
| `POST` | `/api/bookings`            | Bearer | Create a new booking request                      |
| `PATCH`| `/api/bookings/{id}/assign`| Bearer | Assign worker with schedule, collision & radius checks |
| `PATCH`| `/api/bookings/{id}/status`| Bearer | State-machine transition (accepted, in_progress, completed) |
| `PATCH`| `/api/bookings/{id}/cancel`| Bearer | Cancel booking (releasing active job counts)      |
| `PATCH`| `/api/bookings/{id}/reject`| Worker | Reject assigned booking (reverts to pending pool) |

### Ratings & Reviews (`/api/ratings`)
| Method | Path                       | Auth   | Description                                       |
|--------|----------------------------|--------|---------------------------------------------------|
| `GET`  | `/api/ratings`             | Public | Query ratings by `worker_id` or `booking_id`      |
| `POST` | `/api/ratings`             | Bearer | Submit 5-metric review on completed booking       |

### Complaints & Grievance Resolution (`/api/complaints`)
| Method | Path                           | Auth   | Description                                   |
|--------|--------------------------------|--------|-----------------------------------------------|
| `GET`  | `/api/complaints`              | Bearer | List complaints (customer sees own, admin all)|
| `POST` | `/api/complaints`              | Bearer | File a complaint tied to a booking            |
| `PATCH`| `/api/complaints/{id}/resolve` | Admin  | Update status (`under_review` or `resolved`)  |

### Notifications (`/api/notifications`)
| Method | Path                           | Auth   | Description                                   |
|--------|--------------------------------|--------|-----------------------------------------------|
| `GET`  | `/api/notifications`           | Bearer | Get chronological notification feed for user  |
| `PATCH`| `/api/notifications/{id}/read` | Bearer | Mark single notification as read              |
| `PATCH`| `/api/notifications/read-all`  | Bearer | Mark all user notifications as read           |

### Admin & Analytics (`/api/admin`)
| Method | Path                       | Auth   | Description                                       |
|--------|----------------------------|--------|---------------------------------------------------|
| `GET`  | `/api/admin/analytics`     | Admin  | Real-time KPIs, supply/demand, booking aggregates |
| `GET`  | `/api/admin/settings`      | Public | View cooperative commission & matching settings   |
| `PATCH`| `/api/admin/settings`      | Admin  | Configure commission rates & matching weights     |

---

## Connecting the Frontend Mobile Client

In the Expo application root, point `EXPO_PUBLIC_API_URL` to your backend:
```env
EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:8000/api
```
*(Use your computer's local Wi-Fi IP address e.g. `http://192.168.1.100:8000/api` so physical mobile devices on the local network can connect).*
