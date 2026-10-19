from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from app.database import get_db
from app.models.worker import Worker
from app.models.settings import CooperativeSettings
from app.core.matching import check_eligibility, fits_schedule, calculate_match_score
from app.routers.workers import format_worker_dict

router = APIRouter(prefix="/matching", tags=["Matching"])

class FindWorkersPayload(BaseModel):
    serviceId: str
    preferredDate: Optional[str] = None
    preferredTime: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    emergency: Optional[bool] = False

@router.post("/find-workers")
def find_matching_workers(payload: FindWorkersPayload, db: Session = Depends(get_db)):
    workers = db.query(Worker).all()
    settings = db.query(CooperativeSettings).first()
    fairness_weight = settings.auto_assign_fairness_weight if settings else 0.3

    matches = []
    for worker in workers:
        elig = check_eligibility(worker, payload.serviceId)
        if not elig["eligible"]:
            continue
        
        if not fits_schedule(worker, payload.preferredDate, payload.preferredTime, payload.emergency or False):
            continue
        
        score_data = calculate_match_score(
            worker,
            service_id=payload.serviceId,
            booking_lat=payload.latitude,
            booking_lon=payload.longitude,
            fairness_weight=fairness_weight
        )

        matches.append({
            "worker": format_worker_dict(worker),
            "score": score_data["score"],
            "breakdown": score_data["breakdown"],
            "distanceKm": score_data["distanceKm"]
        })

    # Sort descending by score
    matches.sort(key=lambda x: x["score"], reverse=True)
    return matches
