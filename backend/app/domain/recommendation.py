from abc import ABC, abstractmethod
from typing import List
from app.domain.place import Place
from app.domain.user import User

class IRecommendationService(ABC):
    """Interface cho logic gợi ý"""
    @abstractmethod
    def get_recommendations(self, user: User, latitude: float, longitude: float, duration_tag: str) -> List[Place]:
        pass