from typing import List
from pydantic import BaseModel

class RecommendationRequest(BaseModel):
    latitude: float
    longitude: float
    duration_tag: str
    activity: str

class Place(BaseModel):
    id: int
    name: str
    address: str
    image_url: str
    description: str
    tags: List[str]
    rating: float
    open: str
    close: str

class RecommendationResponse(BaseModel):
    recommendations: List[dict]

class RecommendationErrorResponse(BaseModel):
    error: str