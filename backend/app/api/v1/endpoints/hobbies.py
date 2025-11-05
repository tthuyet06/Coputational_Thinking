from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, Header, HTTPException

from backend.app.schemas.schemas import (
    UpdateHobbiesRequest,
    UpdateHobbiesResponse,
)

from backend.app.services.user_service import update_hobbies

router = APIRouter(prefix="/users", tags=["users"])

# ====== MOCK DỮ LIỆU (tạm thời) ======
_fake_users_db = [
    {"id": 1, "email": "user@gmail.com", "full_name": "Nguyen Van A", "hobbies": ["#cafe", "#an_vat"]},
]
_fake_tokens_db = {
    "fake_access_token_user@gmail.com": "user@gmail.com"
}
# =====================================

def get_current_user_from_token(Authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    """
    Dependency: giống users.py — lấy user hiện tại từ token.
    Tách riêng để file này tự chạy độc lập khi bạn chưa muốn tạo core/dependencies.py
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

@router.post("/me/hobbies", response_model=UpdateHobbiesResponse, summary="Cập nhật sở thích người dùng")
def post_me_hobbies(req: UpdateHobbiesRequest, user: Dict[str, Any] = Depends(get_current_user_from_token)):
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
