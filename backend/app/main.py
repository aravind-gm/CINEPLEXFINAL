from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from app.models.database import create_tables
from app.routers import auth, movies, recommendations, users
from app.config import settings
import logging
from pydantic import ValidationError
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Movie Recommendation System")

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://jazzy-sunshine-a0eb75.netlify.app"],  # Add your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Include routers
app.include_router(auth.router)
app.include_router(movies.router)
app.include_router(recommendations.router)
app.include_router(users.router)

# Create database tables on startup
@app.on_event("startup")
async def startup_event():
    create_tables()
    os.makedirs("uploads/avatars", exist_ok=True)

# Root endpoint
@app.get("/")
async def root():
    return {"message": "Movie Recommendation System API"}
