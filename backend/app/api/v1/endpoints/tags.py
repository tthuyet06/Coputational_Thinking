
from fastapi import APIRouter
from backend.app.schemas.schemas import HobbyTagsResponse, DurationTagResponse


from backend.app.services.user_service import (
    list_hobby_tags,
    list_duration_tags,
)

router = APIRouter(prefix="/tags", tags=["tags"])


@router.get("/hobbies", response_model=HobbyTagsResponse, summary="Danh sách chi tiết tất cả Hobbies")
def get_hobbies_list():
    """
    GET /api/v1/tags/hobbies
    - Public (không yêu cầu Authorization).
    - Trả về danh sách chi tiết tất cả các sở thích (Hobby)
    - (Sử dụng MOCK DATA theo yêu cầu)
    """

    # Dữ liệu Mock (Mock Data)
    mock_hobbies_data = [
        {"id": 1, "name": "Ăn chính", "description": "Các địa điểm phục vụ bữa ăn no", "category": "Ẩm thực",
         "tag": "#an_chinh"},
        {"id": 2, "name": "Ăn vặt", "description": "Các địa điểm ăn vặt, đường phố", "category": "Ẩm thực",
         "tag": "#an_vat"},
        {"id": 3, "name": "Cà phê", "description": "Các quán cà phê, không gian làm việc", "category": "Đồ uống",
         "tag": "#cafe"},
        {"id": 4, "name": "Văn hóa", "description": "Các địa điểm văn hóa, lịch sử, bảo tàng", "category": "Khám phá",
         "tag": "#van_hoa"},
        {"id": 5, "name": "Yên tĩnh", "description": "Các không gian cần sự yên tĩnh, thư giãn",
         "category": "Không gian", "tag": "#yen_tinh"},
        {"id": 6, "name": "Sôi động", "description": "Các địa điểm nhộn nhịp, giải trí đêm", "category": "Giải trí",
         "tag": "#soi_dong"},
        {"id": 7, "name": "Sống ảo", "description": "Các địa điểm có thiết kế đẹp để chụp ảnh", "category": "Khám phá",
         "tag": "#song_ao"}
    ]

    return {"hobbies": mock_hobbies_data}

@router.get("/durations", response_model=DurationTagResponse, summary="Danh sách tag thời lượng")
def get_duration_tags():
    """
    GET /api/v1/tags/durations
    - Public.
    - Gọi service list_duration_tags() để lấy 3 lựa chọn theo hợp đồng API.
    """
    return {"duration_tags": list_duration_tags()}
