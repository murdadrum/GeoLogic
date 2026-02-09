from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class GPSData(BaseModel):
    lat: float
    lon: float
    accuracy_m: float
    captured_at: datetime
    
class ClientData(BaseModel):
    user_agent: str
    device_id: Optional[str] = None

class AttestationRequest(BaseModel):
    resource_id: str
    gps: GPSData
    client: ClientData

class Evidence(BaseModel):
    ip: Dict[str, Any]
    gps: Dict[str, Any]

class AttestationResponse(BaseModel):
    decision: str
    score: float
    reason_codes: List[str]
    explanation_user: str
    evidence: Evidence
    policy_version: str
    attestation_id: str
