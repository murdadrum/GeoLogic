from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.llm import llm_service
from typing import Dict, Any

router = APIRouter()

class PromptRequest(BaseModel):
    prompt: str

class PolicyResponse(BaseModel):
    policy: Dict[str, Any]
    summary: str

@router.post("/policies/generate", response_model=PolicyResponse)
def generate_policy(request: PromptRequest):
    try:
        policy = llm_service.generate_policy(request.prompt)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    
    # Simple summary for now, could also use LLM to summarize
    summary = (
        f"Generated policy allowing {policy.get('allowed_countries', [])} "
        f"and denying {policy.get('denied_countries', [])}."
    )
    
    return PolicyResponse(policy=policy, summary=summary)
