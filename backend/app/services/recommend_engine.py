# backend/app/services/recommend_engine.py

from typing import List, Dict, Any
from sqlalchemy.orm import Session

from backend.app.db import models
from backend.app.domain.user import User as DomainUser
from backend.app.domain.place import Place as DomainPlace
from backend.app.domain.location import Location
from backend.app.domain.recommendation import (
    RecommendationCriteria,
    RecommendationResult,
)
from backend.app.repositories import UserRepository, PlaceRepository
from backend.app.utils.geo_utils import haversine_distance

# Khởi tạo repository (stateless, dùng lại được)
user_repo = UserRepository()
place_repo = PlaceRepository()


# ============================================================
# HÀM PUBLIC ĐƯỢC ENDPOINT GỌI
# ============================================================
def get_recommendations(
    db: Session,
    latitude: float,
    longitude: float,
    duration_tag: str | None,
    user: models.User,
) -> List[Dict[str, Any]]:
    """
    Hàm này được endpoint /api/v1/recommend gọi trực tiếp.

    Input:
    - db: Session
    - latitude, longitude: tọa độ hiện tại của user
    - duration_tag: "short" / "medium" / "long" (hiện chưa dùng nhiều, nhưng giữ để mở rộng)
    - user: models.User (lấy từ get_current_user)

    Output:
    - List[dict] theo format Place trong schemas:
        {
          "id": int,
          "name": str,
          "address": str,
          "image_url": str,
          "description": str,
          "tags": List[str]
        }
    """

    # 1. Chuyển ORM User -> domain.User
    domain_user: DomainUser = user_repo.to_domain(user)

    # 2. Tạo tiêu chí recommend (criteria)
    criteria = RecommendationCriteria(
        location=Location(latitude=latitude, longitude=longitude),
        duration_tag=duration_tag,
        extra_tags=domain_user.hobbies,  # dùng hobbies làm tag filter chính
    )

    # 3. Lấy kết quả recommend ở tầng domain
    result: RecommendationResult = _recommend_core(db, domain_user, criteria)

    # 4. Map domain.Place -> dict theo schema Place
    return [
        {
            "id": place.id,
            "name": place.name,
            "address": place.address or "",
            "image_url": place.image or "",
            "description": place.overview or "",
            "tags": place.tags,
        }
        for place in result.places
    ]


# ============================================================
# CORE RECOMMEND LOGIC (DOMAIN LEVEL)
# ============================================================
def _recommend_core(
    db: Session,
    user: DomainUser,
    criteria: RecommendationCriteria,
) -> RecommendationResult:
    """
    Logic gợi ý chính – chạy hoàn toàn trên domain.Place / domain.User.

    Các bước:
    1. Lấy toàn bộ địa điểm từ DB, map sang domain.Place.
    2. Bỏ qua những place không có lat/lon (không tính được khoảng cách).
    3. Nếu user có hobbies:
        - Ưu tiên những place có ít nhất 1 tag khớp với hobbies.
      Nếu không có hobbies: dùng toàn bộ place.
    4. Tính khoảng cách từ user -> place (km) bằng Haversine.
    5. Sắp xếp tăng dần theo distance.
    6. Chọn top N (ví dụ 5) để trả về.
    """

    # B1: Lấy tất cả địa điểm (domain.Place)
    all_places: List[DomainPlace] = place_repo.get_all_as_domain(db)

    # B2: Bỏ các place không có tọa độ
    places_with_location: List[DomainPlace] = [
        p for p in all_places if p.lat is not None and p.lon is not None
    ]

    # B3: Lọc theo hobbies (nếu có)
    if user.hobbies:
        filtered_by_hobby = [
            p for p in places_with_location if p.match_any_tags(user.hobbies)
        ]
        # nếu lọc theo sở thích mà rỗng, fallback = không lọc
        candidates = filtered_by_hobby or places_with_location
    else:
        candidates = places_with_location

    # (Tuỳ chọn) B4: Lọc sơ theo duration_tag (hiện chưa có dữ liệu thời lượng nên chỉ để hook)
    # Ví dụ sau này có cột "estimated_duration" thì xử lý ở đây.
    # Hiện tại chưa dùng duration_tag để loại, chỉ dùng để mở rộng sau.

    # B5: Tính khoảng cách & sort
    scored: List[tuple[float, DomainPlace]] = []
    for place in candidates:
        try:
            dist_km = haversine_distance(
                criteria.location.latitude,
                criteria.location.longitude,
                float(place.lat),
                float(place.lon),
            )
        except Exception:
            # nếu có lỗi dữ liệu, bỏ qua place này
            continue
        scored.append((dist_km, place))

    # Nếu vì lý do gì không tính được distance cho cái nào, fallback dùng all_places
    if not scored:
        scored = [(9999.0, p) for p in candidates]

    # Sắp xếp theo distance tăng dần
    scored.sort(key=lambda x: x[0])

    # B6: Chọn top N (ví dụ 5 địa điểm gần & hợp sở thích nhất)
    TOP_N = 5
    top_places: List[DomainPlace] = [p for _, p in scored[:TOP_N]]

    return RecommendationResult(places=top_places)
