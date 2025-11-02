# backend/app/main.py
from fastapi import FastAPI
from backend.app.api.v1.routers import api_router

app = FastAPI(title="MoodyTrip API")
app.include_router(api_router)  # /api/v1/...
