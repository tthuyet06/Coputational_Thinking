# backend/app/api/v1/endpoints/tags.py (Đã sửa)
from sqlalchemy.orm import Session
from backend.app.db.db_connection import get_db
from fastapi import APIRouter
from backend.app.schemas.schemas import HobbyTagsResponse, DurationTagResponse, ActivityTagsResponse
from fastapi import Depends
# Bỏ import Hobby, Activity

from backend.app.services.user_service import (
    list_duration_tags,
)
from backend.app.services import tag_service # <--- Thêm service mới

router = APIRouter(prefix="/tags", tags=["tags"])


@router.get("/hobbies", response_model=HobbyTagsResponse, summary="Danh sách Hobbies từ DB")
def get_hobbies_list(db: Session = Depends(get_db)):
    """
    GET /api/v1/tags/hobbies
    - Gọi tag_service.list_hobby_tags() để lấy và map dữ liệu.
    """
    # Logic đã chuyển sang tag_service
    results = tag_service.list_hobby_tags(db)
    return {"hobbies": results}

@router.get("/activities", response_model=ActivityTagsResponse, summary="Danh sách tag hoạt động")
def get_activities_list(db: Session = Depends(get_db)):
    """
    GET /api/v1/tags/activities
    - Gọi tag_service.list_activity_tags() để lấy và map dữ liệu.
    """
    # Logic đã chuyển sang tag_service
    results = tag_service.list_activity_tags(db)
    return {"activities": results}

@router.get("/durations", response_model=DurationTagResponse, summary="Danh sách tag thời lượng")
def get_duration_tags():
    """
    GET /api/v1/tags/durations
    - Gọi service list_duration_tags() (từ user_service)
    """
    return {"duration_tags": list_duration_tags()}