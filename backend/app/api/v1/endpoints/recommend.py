from fastapi import APIRouter, Depends, HTTPException, status, Header
from typing import Optional
from backend.app.schemas.location import (
    RecommendationRequest,
    RecommendationResponse,
    RecommendationErrorResponse
)
import random

# IMPORT DEPENDENCY CHUNG
from backend.app.core.dependencies import get_current_user

# IMPORT DB CHUNG (chỉ để lấy mock places)
from backend.app.db.mock_db import MOCK_PLACES_DB

# Thay đổi prefix
router = APIRouter(prefix="/recommend", tags=["recommend"])

# Service mock này bây giờ sẽ dùng DB chung
def get_recommendations(latitude: float, longitude: float, duration_tag: str, user: dict):
    # Dùng MOCK_PLACES_DB
    mock_places = MOCK_PLACES_DB

    # (Bạn có thể thêm logic filter dựa trên user.hobbies ở đây)

    return random.sample(mock_places, k=min(len(mock_places), 2))


@router.post("/",  # Bỏ /recommend vì prefix router đã xử lý
             response_model=RecommendationResponse,
             responses={404: {"model": RecommendationErrorResponse}},
             status_code=status.HTTP_200_OK)
async def recommend_places(
        payload: RecommendationRequest,
        current_user: dict = Depends(get_current_user)  # Dùng dependency chung
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