import math
import re
from datetime import datetime
from typing import List, Dict, Any, Optional

MATCHING_WEIGHTS = {
    "skill": 40,
    "availability": 20,
    "rating": 15,
    "experience": 10,
    "proximity": 10,
    "workload": 5,
}

def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (math.sin(d_lat / 2.0) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(d_lon / 2.0) ** 2)
    return R * 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))

def parse_minutes(time_str: str) -> Optional[int]:
    match = re.search(r'(\d{1,2}):(\d{2})\s*(AM|PM)?', time_str, re.IGNORECASE)
    if not match:
        return None
    hours = int(match.group(1))
    period = match.group(3)
    if period:
        hours = (hours % 12) + (12 if period.upper() == "PM" else 0)
    return hours * 60 + int(match.group(2))

def fits_schedule(worker, preferred_date: Optional[str], preferred_time: Optional[str], emergency: bool = False) -> bool:
    if emergency and not getattr(worker, "emergency_available", False):
        return False
    
    schedule = getattr(worker, "schedule", []) or []
    if not preferred_date or not schedule:
        return True
    
    try:
        dt = datetime.strptime(preferred_date, "%Y-%m-%d")
        day_name = dt.strftime("%A")
    except ValueError:
        return True

    shift = next((s for s in schedule if s.get("day") == day_name), None)
    if not shift:
        return True
    if not shift.get("enabled", True):
        return False
    
    if not preferred_time:
        return True
    
    shift_str = shift.get("shift", "")
    parts = re.split(r'\s*[–—-]\s*', shift_str)
    if len(parts) != 2:
        return True
    
    start_min = parse_minutes(parts[0])
    end_min = parse_minutes(parts[1])
    req_min = parse_minutes(preferred_time)
    
    if start_min is not None and end_min is not None and req_min is not None:
        return start_min <= req_min < end_min
    return True

def check_eligibility(worker, service_id: str) -> Dict[str, Any]:
    if getattr(worker, "verification_status", "") != "verified":
        return {"eligible": False, "reason": "Worker is not verified"}
    if not getattr(worker, "availability", True):
        return {"eligible": False, "reason": "Worker is not available"}
    
    skills = getattr(worker, "skills", []) or []
    has_skill = any(s.get("serviceId") == service_id or s.get("serviceName") == service_id for s in skills)
    if not has_skill:
        return {"eligible": False, "reason": "Worker does not have the required skill"}
    
    return {"eligible": True}

def calculate_match_score(
    worker,
    service_id: str,
    booking_lat: Optional[float] = None,
    booking_lon: Optional[float] = None,
    fairness_weight: float = 0.3
) -> Dict[str, Any]:
    skills = getattr(worker, "skills", []) or []
    has_skill = any(s.get("serviceId") == service_id or s.get("serviceName") == service_id for s in skills)
    skill_score = MATCHING_WEIGHTS["skill"] if has_skill else 0

    availability_score = MATCHING_WEIGHTS["availability"] if getattr(worker, "availability", True) else 0

    total_ratings = getattr(worker, "total_ratings", 0)
    rating_val = getattr(worker, "rating", 5.0)
    if total_ratings == 0:
        rating_score = MATCHING_WEIGHTS["rating"] * 0.5
    else:
        norm_rating = max(0.0, min(1.0, (rating_val - 1.0) / 4.0))
        rating_score = round(norm_rating * MATCHING_WEIGHTS["rating"], 1)

    exp_years = getattr(worker, "experience", 1)
    norm_exp = min(exp_years, 10) / 10.0
    experience_score = round(norm_exp * MATCHING_WEIGHTS["experience"], 1)

    worker_lat = getattr(worker, "latitude", None)
    worker_lon = getattr(worker, "longitude", None)
    distance_km = None
    if (booking_lat is not None and booking_lon is not None and 
        worker_lat is not None and worker_lon is not None):
        distance_km = round(haversine_km(worker_lat, worker_lon, booking_lat, booking_lon), 1)
        max_km = 30.0
        norm_prox = max(0.0, 1.0 - distance_km / max_km)
        proximity_score = round(norm_prox * MATCHING_WEIGHTS["proximity"], 1)
    else:
        proximity_score = MATCHING_WEIGHTS["proximity"] * 0.5

    active_jobs = getattr(worker, "active_jobs", 0)
    max_active = 8.0
    norm_workload = max(0.0, 1.0 - active_jobs / max_active)
    workload_score = round(norm_workload * MATCHING_WEIGHTS["workload"], 1)

    raw_total = (skill_score + availability_score + rating_score + 
                 experience_score + proximity_score + workload_score)

    completed_jobs = getattr(worker, "completed_jobs", 0)
    fairness_bonus = max(0.0, 10.0 - completed_jobs) * fairness_weight
    total = min(100.0, round(raw_total + fairness_bonus, 1))

    return {
        "score": total,
        "distanceKm": distance_km,
        "breakdown": {
            "skillScore": skill_score,
            "availabilityScore": availability_score,
            "ratingScore": rating_score,
            "experienceScore": experience_score,
            "proximityScore": proximity_score,
            "workloadScore": workload_score,
            "total": total,
        }
    }
