from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends
from typing import List

from backend.app.db.db_connection import get_db
from backend.app.db import models
from backend.app.schemas.schemas import UpdateActivitiesRequest, UpdateActivitiesResponse
from backend.app.services.user_service import update_activities
from backend.app.core.dependencies import get_current_user

router = APIRouter(prefix="/users", tags=["users"])

@router.post("/me/activities", response_model=UpdateActivitiesResponse, summary="Cập nhật hoạt động người dùng")
def post_me_activities(
    req: UpdateActivitiesRequest,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    POST /users/me/activities
    - Nhận danh sách code activity từ body (list[str]).
    - Gọi service update_activities(user, req.activities) để:
        + chuyển None -> []
        + loại trùng giữ thứ tự
        + validate code có trong kho hợp lệ (ActivityRepo)
        + gán lại user.activities
    - Trả về message + danh sách đã chuẩn hóa.
    """
    normalized = update_activities(db, user, req.activities)
    return {"message": "Activities updated successfully!", "activities": normalized}