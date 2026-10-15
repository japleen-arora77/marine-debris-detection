from fastapi import FastAPI
from app.api.routes import router
from app.database import Base, engine
from app.model import Analysis, Detection
app = FastAPI(
    title="Marine Debris detection API",
    description="Marine debris detection and mapping backend",
    version="0.1.0",
)
Base.metadata.create_all(bind=engine)
app.include_router(router)

@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "application": "Aqua Scan API",
    }
