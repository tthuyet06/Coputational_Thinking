from typing import List, Dict, Any
from sqlalchemy.orm import Session

import sys
import os

# Tính toán đường dẫn gốc của dự án (Computonal_Thinking)
# os.path.dirname(__file__) là services/
# .. là app/
# .. là backend/
# .. là Computonal_Thinking/ (Project Root)
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))

if project_root not in sys.path:
    sys.path.append(project_root)

# LƯU Ý: Các lệnh import khác (như from backend.app.db import models)
# phải nằm DƯỚI đoạn code này.
# ...

from backend.app.db import models
from backend.app.domain.user import User as DomainUser
from backend.app.domain.place import Place as DomainPlace
from backend.app.domain.location import Location
from backend.app.domain.tag import Tag
from backend.app.domain.activity import Activity
from backend.app.domain.recommendation import (
    RecommendationCriteria,
    RecommendationResult,
)
from backend.app.repositories import (
    UserRepository,
    PlaceRepository,
    TagRepositoryImpl,
    ActivityRepository
)
from backend.app.utils.geo_utils import haversine_distance
from backend.app.services.weather_service import get_current_weather_data, get_main_weather, normalize_weather_tag
from backend.app.utils.time_utils import get_current_hour, to_decimal_hours

user_repo = UserRepository()
place_repo = PlaceRepository()
tag_repo = TagRepositoryImpl()

def get_recommendations(
    db: Session,
    latitude: float,
    longitude: float,
    duration_tag: str | None,
    activities: List[str],
    user: models.User,
) -> List[dict]:

    domain_user = user_repo.to_domain(user)

    criteria = RecommendationCriteria(
        location=Location(latitude=latitude, longitude=longitude),
        duration_tag=duration_tag,
        activities=activities,
        extra_tags=domain_user.hobbies,
    )

    result: RecommendationResult = _recommend_core(db, domain_user, criteria)

    # return result.places
    return [_to_api_dict(p) for p in result.places]


def _recommend_core(db: Session, user: DomainUser, criteria: RecommendationCriteria) -> RecommendationResult:
    all_places: List[DomainPlace] = place_repo.get_all_as_domain(db)
    places = [p for p in all_places if p.lat is not None and p.lon is not None]

    # 1. Loại cứng theo Activity
    places = _filter_by_activity(places, criteria.activities)

    if not places:
        return RecommendationResult(places=[])

    # 2. Loại cứng theo Hobby
    places = _filter_by_hobby(places, criteria.extra_tags)

    if not places:
        return RecommendationResult(places=[])

    # 3. Loại cứng theo khoảng cách tối đa tùy vào duration_tag
    places = _filter_by_gps(places, criteria.location, criteria.duration_tag)

    if not places:
        return RecommendationResult(places=[])

    # 4. Lọc theo thời tiết
    places = _filter_by_weather(criteria, places)

    # 5. Lọc theo thời gian: lọc các địa điểm không phù hợp thời gian(khi user kh chọn activity)
    if not criteria.activities:
        places = _filter_by_current_time(places)

    if not places:
        return RecommendationResult(places=[])

    # 6. Loại cứng theo giờ hoạt động
    # places = _filter_by_opening_hours(criteria, places)

    # 7. Tính điểm từng địa điểm
    tags = tag_repo.get_all(db)
    scored: list[tuple[float, DomainPlace]] = []

    for place in places:
        total_score = _score_place(place, criteria, tags, user)
        scored.append((total_score, place))

    # Sắp xếp giảm dần theo điểm
    scored.sort(key=lambda x: x[0], reverse=True)

    # Chỉ lấy danh sách place (bỏ điểm)
    top_places = [place for _, place in scored[:2]]

    # Cập nhật history của user
    for p in top_places:
        user.update_history(p.id)

    # Lưu lịch sử vào db
    # user.save(db, user)

    return RecommendationResult(places=top_places)


def _filter_by_activity(places: list[DomainPlace], activities: List[str]):
    if not activities:
        return places

    return [p for p in places if p.match_any_tags(activities)]

def _filter_by_hobby(places: list[DomainPlace], hobbies: list[str]):
    if not hobbies:
        return places

    return [p for p in places if p.match_any_tags(hobbies)]

Duration_Data = {
    "#moment": {
        "max_distance": 5,
        "min_stay_time": 1
    },

    "#few_hours": {
        "max_distance": 10,
        "min_stay_time": 2,
    },

    "#long_time": {
        "max_distance": 20,
        "min_stay_time": 3
    },
}

def _filter_by_gps(places: list[DomainPlace], loc: Location, duration_tag: str):
    max_distance_by_duration = Duration_Data.get(duration_tag, {}).get("max_distance")

    if max_distance_by_duration is None:
        return places

    out = []

    for p in places:
        try:
            d = haversine_distance(loc.latitude, loc.longitude, p.lat, p.lon)
        except:
            continue
        if d <= max_distance_by_duration:
            out.append(p)
    return out


EXTREME_WEATHER_TAGS = {"#rain", "#storm", "#snow", "#misty", "#extreme"}
UNSAFE_SPACES_IN_EXTREME_WEATHER = {"#outdoor", "#rooftop"}


def _filter_by_weather(criteria: RecommendationCriteria, places: list[DomainPlace]):
    """Loại bỏ các địa điểm không phù hợp trong thời tiết cực đoan.
    - Nếu thời tiết thuộc EXTREME_WEATHER_TAGS -> loại mọi place chứa tag trong UNSAFE_SPACES_IN_EXTREME_WEATHER."""

    weather_js = get_current_weather_data(criteria.location.latitude, criteria.location.longitude)
    weather = get_main_weather(weather_js)
    weather_tag = normalize_weather_tag(weather)

    if weather_tag in EXTREME_WEATHER_TAGS:
        return [
            p for p in places
            if not any(tag in UNSAFE_SPACES_IN_EXTREME_WEATHER for tag in p.tags)
        ]
    return places


UNSAFE_BY_TIME_TAG = {
    "morning": {"#bar", "#pub", "#buffet", "#bbq", "#seafood", "#late_night_food", "#late_cafe"},
    "noon": {"#hotpot", "#bbq", "#buffet", "#bar", "#pub", "#late_night_food"},
    "night": {"#brunch", "#work_cafe", "#healthy", "#cultural_visit", "#streetfood", "#snack", "#takeaway"}
}


def _filter_by_current_time(places: list[DomainPlace]):
    def time_to_tag(hour: float) -> str:
        """hour: 0–23
        Return: "morning" | "noon" | "night"""

        if 5 <= hour < 11:
            return "morning"
        elif 11 <= hour < 17:
            return "noon"
        else:
            return "night"

    current_time = get_current_hour()
    time_tag = time_to_tag(current_time)
    unsafe_tags = UNSAFE_BY_TIME_TAG.get(time_tag)

    return [
        p for p in places
        if not any(tag in unsafe_tags for tag in p.tags)
    ]

# def _filter_by_opening_hours(criteria: RecommendationCriteria, places: list[DomainPlace]) -> list[DomainPlace]:
    """Trả về các địa điểm đang mở cửa tại current_hour.
    - Hỗ trợ mở qua đêm (vd 22 -> 03)"""

    def is_open_now(place: DomainPlace) -> bool:
        """Kiểm tra giờ mở cửa.
        Nếu start == end == 0 -> mở 24/7.
        Nếu start == end == NULL -> Đóng cửa.
        Nếu end < start -> mở qua đêm."""
        if place.open == place.close:
            if place.open == "NULL":
                return False
            else: # place.open == 0
                return True

        start = to_decimal_hours(p.open)
        end = to_decimal_hours(p.close)
        now = get_current_hour()

        # Mở - đóng trong cùng ngày
        if start < end:
            return start <= now <= end

        # Mở qua đêm (vd 21 -> 4)
        return now >= start or now <= end

    result = []

    for p in places:
        if p.open is None or p.close is None:
            continue

        if is_open_now(p):
            result.append(p)

    return result


def _score_place(place: DomainPlace, criteria: RecommendationCriteria, tags: List[Tag], user: DomainUser) -> float:
    total_score = 0.0

    # 6.1 Hobby tag matching - 50%
    total_score += _score_hobbies(criteria, place, tags)

    # 6.2 Distance - 20%
    total_score += _score_distance(criteria, place)

    # 6.3 Rating - 20%
    total_score += _score_rating(criteria, place)

    # 6.4 Duration - 10%
    total_score += _score_time_relevance(criteria, place)

    # 6.4 History penalty
    total_score *= 1 - _penalty_by_history(place, user)

    return total_score

TAG_TYPE_WEIGHT = {
    "activity": 0,
    "space": 7,
    "special": 5,
    "style": 10,
    "time": 5,
    "vibe": 10,
    "view": 8,
    "weather": 5,
}

def _score_hobbies(criteria: RecommendationCriteria, place: DomainPlace, tags: List[Tag]) -> float:
    hobbies = criteria.extra_tags or []
    place_tags = place.tags or []

    if not hobbies:
        return 0.0

    # 1. Tạo bảng tra cứu Tag -> Group bằng Dictionary Comprehension
    tag_group_map = {t.id: t.group for t in tags if t.group}

    # 2. Gom sở thích người dùng theo nhóm (User Hobbies by Group)
    user_by_group: dict[str, set[str]] = {}
    for code in hobbies:
        group = tag_group_map.get(code)
        if group and TAG_TYPE_WEIGHT.get(group, 0) > 0:  # Chỉ gom nhóm có trọng số > 0
            user_by_group.setdefault(group, set()).add(code)

    # 3. Gom tag địa điểm theo nhóm (Place Tags by Group)
    place_by_group: dict[str, set[str]] = {}
    for code in place_tags:
        group = tag_group_map.get(code)
        if group:
            place_by_group.setdefault(group, set()).add(code)

    total_score = 0.0

    # 4. Tính điểm và tích lũy
    for group, user_codes in user_by_group.items():
        # Trọng số đã được kiểm tra > 0 ở bước 2
        weight = TAG_TYPE_WEIGHT[group]
        place_codes = place_by_group.get(group)

        if place_codes:
            # Số tag trùng
            match_count = len(user_codes.intersection(place_codes))

            if match_count > 0:
                total_user_tags = len(user_codes)

                # Tính điểm: (match / total_user_hobbies_group) * weight
                score = (match_count / total_user_tags) * weight
                total_score += score

    return total_score

def _score_distance(criteria: RecommendationCriteria, place: DomainPlace) -> float:
    distance = haversine_distance(criteria.location.latitude, criteria.location.longitude, place.lat, place.lon)
    max_distance = Duration_Data.get(criteria.duration_tag).get("max_distance")

    MAX_SCORE = 20.0

    if max_distance <= 5:
        if distance < 3:
            return 0.7 * MAX_SCORE
        elif distance < 5:
            return 0.3 * MAX_SCORE

    elif max_distance <= 10:
        if distance < 3:
            return 0.5 * MAX_SCORE
        elif distance < 7:
            return 0.35 * MAX_SCORE
        elif distance < 10:
            return 0.15 * MAX_SCORE

    elif max_distance <= 20:
        if distance < 5:
            return 0.4 * MAX_SCORE
        elif distance < 10:
            return 0.4 * MAX_SCORE
        elif distance < 20:
            return 0.2 * MAX_SCORE

    return 0.0


def _score_rating(criteria: RecommendationCriteria, place: DomainPlace) -> float:
    """Tính điểm dựa trên rating của place.
    - rating tối đa 5 sao -> tối đa 20 điểm"""

    MAX_POINTS = 20.0
    return (place.rating / 5.0) * MAX_POINTS


def _score_time_relevance(criteria: RecommendationCriteria, place: DomainPlace) -> float:
    MAX_SCORE = 10.0

    current_time = get_current_hour()
    min_stay_time = Duration_Data.get(criteria.duration_tag).get("min_stay_time")

    # close_time = .... # get close time sau
    close_time = 25 # Mock taị chưa có data
    if current_time + min_stay_time > close_time:
        return 0.0

    return MAX_SCORE

def _penalty_by_history(place: DomainPlace, user: DomainUser) -> float:
    MAX_COUNT = 7

    n = user.get_reco_count_by_place_id(place.id)
    if n <= MAX_COUNT:
        return n * 0.1

    # Nếu count lỗi(out of range [0,7] thì giữ nguyên
    return 0


def _to_api_dict(place: DomainPlace) -> dict:
    return {
        "id": place.id,
        "name": place.name,
        # "link_address": place.link_address,
        # "latitude": place.lat,
        # "longitude": place.lon,
        "address": place.address or "",
        "image": place.image or "",
        "description": place.overview or "",
        "tags": place.tags,
        "rating": place.rating or "",
        # "open": place.open or "",
        # "close": place.close or "",
    }