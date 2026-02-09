from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models_db import Policy, AuditLog, Base
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import json
import uuid

router = APIRouter()

class PolicyResponse(BaseModel):
    id: int
    version: str
    content: Dict[str, Any]
    active: bool
    created_at: Any  # Accept datetime, will be serialized to string

    class Config:
        from_attributes = True
        json_encoders = {
            'datetime': lambda v: v.isoformat() if v else None
        }

class PolicyCreate(BaseModel):
    version: str
    content: Dict[str, Any]
    active: bool = False

@router.get("/policies", response_model=List[PolicyResponse])
def get_policies(db: Session = Depends(get_db)):
    return db.query(Policy).order_by(Policy.created_at.desc()).limit(10).all()

@router.post("/policies", response_model=PolicyResponse)
def create_policy(policy: PolicyCreate, db: Session = Depends(get_db)):
    if policy.active:
        # Deactivate others
        db.query(Policy).update({Policy.active: False})
    
    db_policy = Policy(version=policy.version, content=policy.content, active=policy.active)
    db.add(db_policy)
    db.commit()
    db.refresh(db_policy)
    return db_policy

class AuditLogResponse(BaseModel):
    attestation_id: str
    timestamp: Optional[Any] = None  # Accept datetime, will be serialized
    decision: str
    resource_id: str
    reason_codes: Optional[List[str]] = None
    ip_address: Optional[str] = None
    gps_lat: Optional[float] = None
    gps_lon: Optional[float] = None
    
    class Config:
        from_attributes = True
        json_encoders = {
            'datetime': lambda v: v.isoformat() if v else None
        }

@router.get("/audit", response_model=List[AuditLogResponse])
def get_audit_logs(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    return db.query(AuditLog).order_by(AuditLog.timestamp.desc()).offset(skip).limit(limit).all()
