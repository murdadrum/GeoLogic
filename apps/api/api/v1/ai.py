from fastapi import APIRouter
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
    policy = llm_service.generate_policy(request.prompt)
    
    # Simple summary for now, could also use LLM to summarize
    summary = f"Generated policy allowing {policy.get('allowed_countries', [])}."
    
    return PolicyResponse(policy=policy, summary=summary)
