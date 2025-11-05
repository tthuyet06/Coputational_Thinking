from fastapi import APIRouter, Depends, HTTPException, status, Header
from typing import Optional
from backend.app.schemas.location import (
    RecommendationRequest,
    RecommendationResponse,
    RecommendationErrorResponse
)
import random

router = APIRouter(prefix="/api", tags=["recommend"])


from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Header, status


# Mock dữ liệu người dùng và hàm xác thực
mock_database = [
    {
        "id": 1,
        "email": "user1@example.com",
        "full_name": "User Mot",
        "password": "password123"
    },
    {
        "id": 2,
        "email": "user2@example.com",
        "full_name": "User Hai",
        "password": "password456"
    }
]

mock_access_tokens = {
    "access_for_user1@example.com": "user1@example.com",
    "access_for_user2@example.com": "user2@example.com"
}


def get_current_user(Authorization: Optional[str] = Header(None)):
    if not Authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Thiếu Authorization header."
        )

    try:
        scheme, token = Authorization.split()
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header không hợp lệ (thiếu Bearer)."
        )

    if scheme.lower() != "bearer" or token not in mock_access_tokens:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Access token không hợp lệ hoặc đã hết hạn."
        )

    email = mock_access_tokens[token]
    user = next((u for u in mock_database if u["email"] == email), None)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Người dùng không tồn tại."
        )

    return user


def get_recommendations(latitude: float, longitude: float, duration_tag: str, user: dict):
    mock_places = [
        {
            "id": 101,
            "name": "Bảo tàng Chứng tích Chiến tranh",
            "address": "28 Võ Văn Tần, Quận 3",
            "image_url": "https://link-to-image.png",
            "description": "Nơi lưu giữ tư liệu lịch sử, phù hợp cho buổi chiều tìm hiểu văn hóa.",
            "tags": ["#vai_tieng", "#van_hoa", "#trong_nha"]
        },
        {
            "id": 102,
            "name": "Cà phê Sách XYZ",
            "address": "456 Đường ABC, Quận 1",
            "image_url": "https://link-to-image2.png",
            "description": "Quán cà phê yên tĩnh với decor cổ điển, lý tưởng để đọc sách.",
            "tags": ["#vai_tieng", "#cafe", "#yen_tinh"]
        },
        {
            "id": 103,
            "name": "Phố đi bộ Nguyễn Huệ",
            "address": "Nguyễn Huệ, Quận 1",
            "image_url": "https://link-to-image3.png",
            "description": "Địa điểm vui chơi sôi động, phù hợp dạo phố buổi tối.",
            "tags": ["#toi", "#soi_dong", "#ngoai_troi"]
        }
    ]

    return random.sample(mock_places, k=2)


@router.post("/recommend",
             response_model=RecommendationResponse,
             responses={404: {"model": RecommendationErrorResponse}},
             status_code=status.HTTP_200_OK)
async def recommend_places(
    payload: RecommendationRequest,
    current_user: dict = Depends(get_current_user)
):

    results = get_recommendations(
        latitude=payload.latitude,
        longitude=payload.longitude,
        duration_tag=payload.duration_tag,
        user=current_user
    )

    if not results:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy gợi ý nào phù hợp với lựa chọn của bạn."
        )

    return RecommendationResponse(recommendations=results)