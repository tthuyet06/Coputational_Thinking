import pytest
from backend.app.services.recommend_engine import Recommendation

@pytest.fixture
def recommendation_service():
    return Recommendation(weather_service=None, time_service=None, place_repo=None)