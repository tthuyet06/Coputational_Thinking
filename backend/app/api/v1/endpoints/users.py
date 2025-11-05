
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, Header, HTTPException


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

router = APIRouter(prefix="/users", tags=["users"])

# ====== MOCK DỮ LIỆU (tạm thời thay DB/thư viện token) ======
_fake_users_db = [
    {"id": 1, "email": "user@gmail.com", "full_name": "Nguyen Van A", "hobbies": ["#cafe", "#an_vat"]},
]
_fake_tokens_db = {
    # map access_token -> email
    "fake_access_token_user@gmail.com": "user@gmail.com"
}
# ============================================================

def get_current_user_from_token(Authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    """
    Dependency: lấy user hiện tại từ header Authorization.
    - Format: 'Bearer <token>'
    - Từ token -> email -> tìm user trong _fake_users_db
    """
    if not Authorization or not Authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Thiếu hoặc sai định dạng Authorization header.")
    token = Authorization.replace("Bearer ", "")
    if token not in _fake_tokens_db:
        raise HTTPException(status_code=401, detail="Access token không hợp lệ hoặc đã hết hạn.")
    email = _fake_tokens_db[token]
    user = next((u for u in _fake_users_db if u["email"] == email), None)
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng.")
    return user

@router.get("/me", response_model=UserResponse, summary="Lấy thông tin người dùng hiện tại")
def get_me(user: Dict[str, Any] = Depends(get_current_user_from_token)):
    """
    GET /api/v1/users/me
    - DI inject 'user' đã xác thực qua dependency.
    - Gọi service get_profile(user) để trả về đúng contract UserResponse.
    """
    return get_profile(user)  # -> service chuẩn hóa dữ liệu (đảm bảo field/shape)

@router.patch("/me", response_model=UserResponse, summary="Cập nhật tên hiển thị")
def patch_me(req: UpdateUserRequest, user: Dict[str, Any] = Depends(get_current_user_from_token)):
    """
    PATCH /api/v1/users/me
    - Body: { "full_name": "..." } đã được Pydantic validate ở UpdateUserRequest.
    - Giao toàn bộ cho service update_name(user, full_name) xử lý.
    """
    return update_name(user, req.full_name)  # -> service trim + validate + trả hồ sơ mới
