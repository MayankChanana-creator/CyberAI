from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import cypherx

app = FastAPI(
    title="CypherX - Insider Threat Detection System",
    description="AI-Powered User Behavior Analytics and Threat Prioritization",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(cypherx.router)

@app.get("/")
def root():
    return {"message": "CypherX Insider Threat Detection API", "status": "running"}

@app.get("/health")
def health():
    return {"status": "healthy", "service": "CypherX"}
