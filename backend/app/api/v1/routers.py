# backend/app/api/v1/routers.py
from fastapi import APIRouter
from backend.app.api.v1.endpoints.users import router as users_router
from backend.app.api.v1.endpoints.hobbies import router as hobbies_router
from backend.app.api.v1.endpoints.tags import router as tags_router
from backend.app.api.v1.endpoints.auth import router as auth_router
from backend.app.api.v1.endpoints.recommend import router as  recommend_router

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth_router)
api_router.include_router(users_router)   # /api/v1/users/*
api_router.include_router(hobbies_router) # /api/v1/hobbies/*
api_router.include_router(recommend_router) # /api/v1/recommend/*
api_router.include_router(tags_router)    # /api/v1/tags/*
api_router.include_router(auth_router)
api_router.include_router(recommend_router)

