from sqlalchemy.orm import Session
from backend.app.db.deps import get_db
from backend.app.db import models
from typing import Optional, Dict, Any
from fastapi.security import APIKeyHeader
from fastapi import APIRouter, Depends, HTTPException, Security, Header
from starlette import status

from backend.app.schemas.schemas import (
    UserResponse,
    UpdateUserRequest,
    UpdateHobbiesRequest,
    UpdateHobbiesResponse,
    FavoriteRequest,
    Place
)

from backend.app.services.user_service import (
    get_profile,
    update_name,
    update_hobbies,
    list_favorites,
    toggle_favorite
)

from backend.app.core.dependencies import get_current_user
router = APIRouter(prefix="/users", tags=["users"])

authorization_header = APIKeyHeader(name="Authorization", auto_error=False)

@router.get("/me", response_model=UserResponse, summary="Lấy thông tin người dùng hiện tại")
async def get_me(current_user: models.User = Depends(get_current_user)):
    return get_profile(current_user)

@router.patch("/me", response_model=UserResponse, summary="Cập nhật tên hiển thị")
async def patch_me(
    req: UpdateUserRequest,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    updated_user = update_name(db, user, req.username)
    return get_profile(updated_user)
