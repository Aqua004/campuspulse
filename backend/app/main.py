from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from .config import settings
from .database import Base, SessionLocal, engine
from .routers.incidents import router as incidents_router


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title=settings.app_name, version="0.1.0", description="Campus issue reporting and incident tracking API", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(incidents_router, prefix="/api")


@app.get("/api/health", tags=["system"])
def health():
    with SessionLocal() as database:
        database.execute(text("SELECT 1"))
    return {"status": "healthy", "service": settings.app_name, "version": "0.1.0"}


@app.get("/")
def root():
    return {"message": "CampusPulse API", "docs": "/docs", "health": "/api/health"}
