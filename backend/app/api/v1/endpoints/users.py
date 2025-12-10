from sqlalchemy.orm import Session
from backend.app.db.db_connection import get_db
from backend.app.db import models

from fastapi.security import APIKeyHeader
from fastapi import APIRouter, Depends, HTTPException, Security, Header
from starlette import status

from backend.app.schemas.schemas import (
    UserResponse,
    UpdateUserRequest,
    ChangePasswordRequest
)

from backend.app.services.user_service import (
    get_profile,
    update_name,
    change_user_password
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

@router.put("/me/password", summary="Đổi mật khẩu")
async def update_password(
    req: ChangePasswordRequest,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    API đổi mật khẩu người dùng.
    Yêu cầu: Mật khẩu cũ và mật khẩu mới.
    """
    return change_user_password(db, user, req.old_password, req.new_password)