from typing import List
from ..domain.recommendation import IRecommendationService
from ..domain.place import Place
from ..domain.user import User
import random
from ..db import models
from ..db.models import User as UserModel
from sqlalchemy.orm import Session
from sqlalchemy import or_
def get_recommendations(
        db: Session,
        latitude: float,
        longitude: float,
        duration_tag: str,
        user: UserModel
):
    # ✅ Bước 1: Lấy sở thích của user
    # Chuyển chuỗi "cafe,yen_tinh" thành list ["#cafe", "#yen_tinh"]
    user_hobbies = []
    if user.hobbies:
        user_hobbies = [f"#{tag.strip()}" for tag in user.hobbies.split(',') if tag.strip()]

    # ✅ Bước 2: Lọc địa điểm
    # Chúng ta sẽ lọc các địa điểm có tag thời lượng khớp VÀ
    # có ÍT NHẤT MỘT tag sở thích khớp

    query = db.query(models.Place)

    # 2a. Lọc theo duration_tag (BẮT BUỘC)
    # Dùng .like() để tìm kiếm trong chuỗi tags (ví dụ: "#cafe,#yen_tinh,#vai_tieng")
    query = query.filter(models.Place.tags.like(f"%{duration_tag}%"))

    # 2b. Lọc theo sở thích (TÙY CHỌN)
    if user_hobbies:
        # Xây dựng list các điều kiện LIKE
        # (Place.tags LIKE "%#cafe%" OR Place.tags LIKE "%#yen_tinh%")
        hobby_filters = [models.Place.tags.like(f"%{hobby}%") for hobby in user_hobbies]

        # Áp dụng các điều kiện bằng 'or_'
        query = query.filter(or_(*hobby_filters))

    # ✅ Bước 3: (Tương lai) Sắp xếp theo khoảng cách (latitude, longitude)
    # (Logic tính khoảng cách khá phức tạp, tạm thời lấy tất cả kết quả)

    filtered_places = query.all()

    if not filtered_places:
        return []

    # ✅ Bước 4: Trả về kết quả (có thể giới hạn số lượng)
    # Lấy ngẫu nhiên 3 địa điểm trong danh sách đã lọc
    return random.sample(filtered_places, k=min(len(filtered_places), 3))

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