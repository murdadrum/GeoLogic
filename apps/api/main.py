from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="GeoLogic API", version="0.1.0")

# Configure CORS - MUST be before importing routers
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import routers AFTER CORS middleware
from api.v1 import attestations, admin, ai

app.include_router(attestations.router, prefix="/v1", tags=["attestations"])
app.include_router(admin.router, prefix="/v1/admin", tags=["admin"])
app.include_router(ai.router, prefix="/v1/ai", tags=["ai"])

@app.get("/")
def read_root():
    return {"message": "Welcome to GeoLogic API"}
