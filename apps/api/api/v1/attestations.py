from fastapi import APIRouter, Depends, HTTPException
from models import AttestationRequest, AttestationResponse, Evidence
from models_db import AuditLog, Policy
from database import get_db
from sqlalchemy.orm import Session
import uuid

from services.llm import llm_service

router = APIRouter()

@router.post("/attestations", response_model=AttestationResponse)
async def create_attestation(request: AttestationRequest, db: Session = Depends(get_db)):
    policy = db.query(Policy).filter(Policy.active == True).order_by(Policy.created_at.desc()).first()

    policy_content = policy.content if policy and isinstance(policy.content, dict) else {}
    policy_version = policy.version if policy else "no-active-policy"
    allowed_countries = {str(code).upper() for code in policy_content.get("allowed_countries", [])}
    denied_countries = {str(code).upper() for code in policy_content.get("denied_countries", [])}
    max_accuracy_m = (
        policy_content.get("gps_rules", {}).get("max_accuracy_m", 1000)
        if isinstance(policy_content.get("gps_rules", {}), dict)
        else 1000
    )
    decision_scores = policy_content.get("decision_scores", {}) if isinstance(policy_content.get("decision_scores", {}), dict) else {}

    def _decision_score(key: str, fallback: float) -> float:
        try:
            return float(decision_scores.get(key, fallback))
        except (TypeError, ValueError):
            return fallback

    score_map = {
        "ALLOW": _decision_score("ALLOW", 0.9),
        "STEP_UP": _decision_score("STEP_UP", 0.5),
        "DENY": _decision_score("DENY", 0.1),
    }

    decision = "ALLOW"
    reason_codes = []
    explanation = "Your location was verified successfully."

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

    country = str(evidence_data["ip"]["country"]).upper()
    if country in denied_countries:
        decision = "DENY"
        reason_codes.append("COUNTRY_DENIED")
    elif allowed_countries and country not in allowed_countries:
        decision = "DENY"
        reason_codes.append("COUNTRY_NOT_ALLOWED")
    else:
        reason_codes.append("COUNTRY_MATCH")

    if decision == "ALLOW" and request.gps.accuracy_m > max_accuracy_m:
        decision = "STEP_UP"
        reason_codes.append("GPS_LOW_ACCURACY")
    
    # Use LLM Service for explanation
    try:
        explanation = llm_service.explain_decision(decision, reason_codes, evidence_data)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    
    attestation_id = str(uuid.uuid4())
    
    # Save to Audit Log
    audit_log = AuditLog(
        attestation_id=attestation_id,
        resource_id=request.resource_id,
        decision=decision,
        reason_codes=reason_codes,
        score=score_map.get(decision, 0.5),
        ip_address="127.0.0.1", # Mock
        gps_lat=request.gps.lat,
        gps_lon=request.gps.lon,
        gps_accuracy=request.gps.accuracy_m,
        full_evidence=evidence_data,
        policy_version=policy_version
    )
    db.add(audit_log)
    db.commit()

    return AttestationResponse(
        decision=decision,
        score=score_map.get(decision, 0.5),
        reason_codes=reason_codes,
        explanation_user=explanation,
        evidence=Evidence(**evidence_data),
        policy_version=policy_version,
        attestation_id=attestation_id
    )
