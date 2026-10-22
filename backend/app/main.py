from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.database import engine
from app.models import (
    User, Cooperative, Service, Worker,
    Booking, Rating, Complaint, Notification, CooperativeSettings
)
from app.database import Base
from app.routers import (
    auth, services, workers, bookings, ratings,
    complaints, notifications, admin, matching, cooperatives
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create all tables on startup
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=(
        "Sevai One Backend REST API — provides authentication, service catalogue, "
        "worker management, booking lifecycle, matching engine, ratings, complaints, "
        "notifications and admin analytics."
    ),
    lifespan=lifespan,
)

# CORS — allow Expo / React Native dev client and web
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # Restrict to your domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all routers under /api
API_PREFIX = settings.API_V1_STR
app.include_router(auth.router,          prefix=API_PREFIX)
app.include_router(services.router,      prefix=API_PREFIX)
app.include_router(workers.router,       prefix=API_PREFIX)
app.include_router(bookings.router,      prefix=API_PREFIX)
app.include_router(ratings.router,       prefix=API_PREFIX)
app.include_router(complaints.router,    prefix=API_PREFIX)
app.include_router(notifications.router, prefix=API_PREFIX)
app.include_router(admin.router,         prefix=API_PREFIX)
app.include_router(matching.router,      prefix=API_PREFIX)
app.include_router(cooperatives.router,  prefix=API_PREFIX)

@app.get("/", tags=["Health"])
def root():
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "running",
        "docs": "/docs",
    }

@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}
