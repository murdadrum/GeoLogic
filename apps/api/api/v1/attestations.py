from fastapi import APIRouter, Depends
from models import AttestationRequest, AttestationResponse, Evidence
from models_db import AuditLog, Policy
from database import get_db
from sqlalchemy.orm import Session
from datetime import datetime
import uuid
import json

from services.llm import llm_service

router = APIRouter()

@router.post("/attestations", response_model=AttestationResponse)
async def create_attestation(request: AttestationRequest, db: Session = Depends(get_db)):
    # TODO: Fetch active policy
    # policy = db.query(Policy).filter(Policy.active == True).first()
    
    # Simple mock logic: if accuracy is bad, step up. If good, allow.
    decision = "ALLOW"
    reason_codes = ["COUNTRY_MATCH"]
    explanation = "Your location was verified successfully."
    
    if request.gps.accuracy_m > 1000:
        decision = "STEP_UP"
        reason_codes.append("GPS_LOW_ACCURACY")
        # explanation = "Your GPS signal is not accurate enough..." # Old static string
    
    # Construct mock evidence
    evidence_data = {
        "ip": {
            "country": "US",
            "region": "IL",
            "asn_org": "Mock ISP",
            "vpn": False
        },
        "gps": {
            "country": "US",
            "accuracy_m": request.gps.accuracy_m
        }
    }
    
    # Use LLM Service (or Mock fallback) for explanation
    explanation = llm_service.explain_decision(decision, reason_codes, evidence_data)
    
    attestation_id = str(uuid.uuid4())
    
    # Save to Audit Log
    audit_log = AuditLog(
        attestation_id=attestation_id,
        resource_id=request.resource_id,
        decision=decision,
        reason_codes=reason_codes,
        score=0.9 if decision == "ALLOW" else 0.5,
        ip_address="127.0.0.1", # Mock
        gps_lat=request.gps.lat,
        gps_lon=request.gps.lon,
        gps_accuracy=request.gps.accuracy_m,
        full_evidence=evidence_data,
        policy_version="2026-02-09.1"
    )
    db.add(audit_log)
    db.commit()

    return AttestationResponse(
        decision=decision,
        score=0.9 if decision == "ALLOW" else 0.5,
        reason_codes=reason_codes,
        explanation_user=explanation,
        evidence=Evidence(**evidence_data),
        policy_version="2026-02-09.1",
        attestation_id=attestation_id
    )
