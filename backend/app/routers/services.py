from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional, List
from app.database import get_db
from app.models.service import Service
from app.schemas.service import ServiceResponse, ServiceCreate
from app.core.dependencies import require_role

router = APIRouter(prefix="/services", tags=["Services"])

@router.get("", response_model=List[ServiceResponse])
def get_services(category: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Service)
    if category:
        query = query.filter(Service.category.ilike(category))
    return query.all()

@router.get("/{service_id}", response_model=ServiceResponse)
def get_service_by_id(service_id: str, db: Session = Depends(get_db)):
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")
    return service

@router.post("", response_model=ServiceResponse)
def create_service(
    payload: ServiceCreate,
    db: Session = Depends(get_db),
    admin_user = Depends(require_role(["admin"]))
):
    service = Service(**payload.model_dump())
    db.add(service)
    db.commit()
    db.refresh(service)
    return service
