from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, Header, HTTPException

from backend.app.schemas.schemas import (
    UpdateHobbiesRequest,
    UpdateHobbiesResponse,
)

from backend.app.services.user_service import update_hobbies

from backend.app.core.dependencies import get_current_user
router = APIRouter(prefix="/users", tags=["users"])

@router.post("/me/hobbies", response_model=UpdateHobbiesResponse, summary="Cập nhật sở thích người dùng")
def post_me_hobbies(req: UpdateHobbiesRequest, user: Dict[str, Any] = Depends(get_current_user)):
    """
    POST /api/v1/users/me/hobbies
    - Nhận danh sách tag sở thích từ body (đã validate kiểu mảng string).
    - Gọi service update_hobbies(user, req.hobbies) để:
        + chuyển None -> []
        + loại trùng giữ thứ tự
        + validate tag có trong kho hợp lệ
        + gán lại user["hobbies"]
    - Trả về message + danh sách đã chuẩn hóa.
    """
    normalized = update_hobbies(user, req.hobbies)
    return {"message": "Cập nhật sở thích thành công!", "hobbies": normalized}
