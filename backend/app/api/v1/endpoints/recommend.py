from fastapi import APIRouter, Depends, HTTPException, status, Header
from typing import Optional
from backend.app.schemas.location import (
    RecommendationRequest,
    RecommendationResponse,
    RecommendationErrorResponse
)
from ....services.recommend_engine import get_current_user, get_recommendations

router = APIRouter(prefix="/recommend", tags=["recommend"])


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