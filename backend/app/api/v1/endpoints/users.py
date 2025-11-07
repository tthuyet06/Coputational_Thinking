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
async def get_me(current_user: dict = Depends(get_current_user)):
    """
    GET /api/v1/users/me
    - DI inject 'user' đã xác thực qua dependency.
    - Gọi service get_profile(user) để trả về đúng contract UserResponse.
    """
    return get_profile(current_user)  # -> service chuẩn hóa dữ liệu (đảm bảo field/shape)

@router.patch("/me", response_model=UserResponse, summary="Cập nhật tên hiển thị")
async def patch_me(req: UpdateUserRequest, user: Dict[str, Any] = Depends(get_current_user)):
    """
    PATCH /api/v1/users/me
    - Body: { "full_name": "..." } đã được Pydantic validate ở UpdateUserRequest.
    - Giao toàn bộ cho service update_name(user, full_name) xử lý.
    """
    return update_name(user, req.username)  # -> service trim + validate + trả hồ sơ mới
