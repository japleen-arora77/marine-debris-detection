
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware #for frontend communication
from app.api.routes import router
from app.database import Base, engine
from app.model import Analysis, Detection


app = FastAPI(
    title="Marine Debris Detection API",
    description="Marine debris detection and mapping backend",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create database tables
Base.metadata.create_all(bind=engine)


# Register API routes
app.include_router(router)


# Health check endpoint
@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "application": "Aqua Scan API",
    }
