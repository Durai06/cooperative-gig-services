from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.cooperative import Cooperative
from app.schemas.cooperative import CooperativeResponse, CooperativeCreate
from app.core.dependencies import require_role

router = APIRouter(prefix="/cooperatives", tags=["Cooperatives"])

def format_cooperative_dict(c: Cooperative) -> dict:
    return {
        "id": c.id,
        "name": c.name,
        "location": c.location,
        "contact": c.contact,
    }

@router.get("", response_model=List[CooperativeResponse])
def get_cooperatives(search: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Cooperative)
    if search:
        query = query.filter(
            Cooperative.name.ilike(f"%{search}%") | Cooperative.location.ilike(f"%{search}%")
        )
    coops = query.all()
    return coops

@router.get("/{cooperative_id}", response_model=CooperativeResponse)
def get_cooperative_by_id(cooperative_id: str, db: Session = Depends(get_db)):
    coop = db.query(Cooperative).filter(Cooperative.id == cooperative_id).first()
    if not coop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cooperative not found")
    return coop

@router.post("", response_model=CooperativeResponse, status_code=status.HTTP_201_CREATED)
def create_cooperative(
    payload: CooperativeCreate,
    db: Session = Depends(get_db),
    admin_user = Depends(require_role(["admin"]))
):
    coop = Cooperative(
        id=payload.id if payload.id else None,
        name=payload.name,
        location=payload.location,
        contact=payload.contact,
    )
    db.add(coop)
    db.commit()
    db.refresh(coop)
    return coop
