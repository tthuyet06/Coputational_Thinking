
from fastapi import APIRouter
from backend.app.schemas.schemas import HobbyTagsResponse, DurationTagResponse


from backend.app.services.user_service import (
    list_hobby_tags,
    list_duration_tags,
)

router = APIRouter(prefix="/api/v1/tags", tags=["tags"])

@router.get("/hobbies", response_model=HobbyTagsResponse, summary="Danh sách tất cả sở thích có thể chọn")
def get_hobby_tags():
    """
    GET /api/v1/tags/hobbies
    - Public (không yêu cầu Authorization).
    - Gọi service list_hobby_tags() để lấy danh sách hợp lệ.
    """
    return {"tags": list_hobby_tags()}

@router.get("/durations", response_model=DurationTagResponse, summary="Danh sách tag thời lượng")
def get_duration_tags():
    """
    GET /api/v1/tags/durations
    - Public.
    - Gọi service list_duration_tags() để lấy 3 lựa chọn theo hợp đồng API.
    """
    return {"duration_tags": list_duration_tags()}
