from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, Float, ForeignKey, JSON
from sqlalchemy.sql import func
from database import Base
import uuid
import datetime

class Policy(Base):
    __tablename__ = "policies"

    id = Column(Integer, primary_key=True, index=True)
    version = Column(String, unique=True, index=True)
    content = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    active = Column(Boolean, default=False)
    author = Column(String, nullable=True) # Who created it

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    attestation_id = Column(String, unique=True, index=True) # UUID from request
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    resource_id = Column(String, index=True)
    
    # Decisions
    decision = Column(String, nullable=False) # ALLOW, STEP_UP, DENY
    reason_codes = Column(JSON, nullable=True)
    score = Column(Float, nullable=True)
    
    # Evidence snapshots
    ip_address = Column(String, nullable=True)
    gps_lat = Column(Float, nullable=True)
    gps_lon = Column(Float, nullable=True)
    gps_accuracy = Column(Float, nullable=True)
    
    full_evidence = Column(JSON, nullable=True) # Full evidence blob
    policy_version = Column(String, ForeignKey("policies.version"), nullable=True)
