from typing import List
from app.domain.recommendation import IRecommendationService
from app.domain.place import Place
from app.domain.user import User

class RecommendEngine(IRecommendationService):
    def __init__(self, weather_service, time_service, place_repo):
        self.weather_service = weather_service
        self.time_service = time_service
        self.place_repo = place_repo

    def get_recommendations(self, user: User, latitude: float, longitude: float, duration_tag: str) -> List[Place]:
        weather = self.weather_service.get_weather(latitude, longitude)
        current_time = self.time_service.get_current_hour()

        candidates = self.place_repo.get_places_by_duration(duration_tag)
        filtered = [
            p for p in candidates
            if p.match_tags(user.hobbies)
        ]

        return filtered