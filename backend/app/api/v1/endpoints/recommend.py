from fastapi import APIRouter, Depends, HTTPException, status, Header
from backend.app.schemas.location import (
    RecommendationRequest,
    RecommendationResponse,
    RecommendationErrorResponse
)
from sqlalchemy.orm import Session
from backend.app.db.deps import get_db
from backend.app.db import models
from ....services.recommend_engine import get_recommendations
from backend.app.core.dependencies import get_current_user
router = APIRouter(prefix="/recommend", tags=["recommend"])


@router.post("/",  # Bỏ /recommend vì prefix router đã xử lý
             response_model=RecommendationResponse,
             responses={404: {"model": RecommendationErrorResponse}},
             status_code=status.HTTP_200_OK)
async def recommend_places(
        payload: RecommendationRequest,
        current_user: models.User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    results = get_recommendations(
        db=db,
        latitude=payload.latitude,
        longitude=payload.longitude,
        duration_tag=payload.duration_tag,
        user=current_user
    )

    if not results:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No suitable recommendations found for your choices."
        )

    return RecommendationResponse(recommendations=results)