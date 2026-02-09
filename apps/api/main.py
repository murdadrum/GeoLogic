from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.v1 import attestations

app = FastAPI(title="AccessGate AI API", version="0.1.0")

# Configure CORS
origins = [
    "http://localhost:3000",
    "http://localhost:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from api.v1 import attestations, admin, ai

app.include_router(attestations.router, prefix="/v1", tags=["attestations"])
app.include_router(admin.router, prefix="/v1/admin", tags=["admin"])
app.include_router(ai.router, prefix="/v1/ai", tags=["ai"])

@app.get("/")
def read_root():
    return {"message": "Welcome to AccessGate AI API"}
