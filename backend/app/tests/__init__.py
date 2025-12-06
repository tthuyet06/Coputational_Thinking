import pytest
from backend.app.services.recommend_engine import RecommendationCriteria

@pytest.fixture
def recommendation_service():
    return RecommendationCriteria(weather_service=None, time_service=None, place_repo=None)