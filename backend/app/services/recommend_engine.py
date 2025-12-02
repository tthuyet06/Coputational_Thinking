from typing import List, Dict, Any
from sqlalchemy.orm import Session

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
from backend.app.repositories import (UserRepository, PlaceRepository, TagRepositoryImpl, ActivityRepository)
from backend.app.utils.geo_utils import haversine_distance
from backend.app.utils.weather_utils import get_weather
from backend.app.utils.time_utils import get_current_hour

user_repo = UserRepository()
place_repo = PlaceRepository()
tag_repo = TagRepositoryImpl()
# history_repo = HistoryRepository()

def get_recommendations(
    db: Session,
    latitude: float,
    longitude: float,
    duration_tag: str | None,
    activities: List[str],
    user: models.User,
) -> List[DomainPlace]:

    domain_user = user_repo.to_domain(user)

    criteria = RecommendationCriteria(
        location=Location(latitude=latitude, longitude=longitude),
        duration_tag=duration_tag,
        activities=activities,
        extra_tags=domain_user.hobbies,
    )

    result: RecommendationResult = _recommend_core(db, domain_user, criteria)

    return result.places
    # return [_to_api_dict(p) for p in result.places]


def _recommend_core(db: Session, user: DomainUser, criteria: RecommendationCriteria) -> RecommendationResult:
    all_places: List[DomainPlace] = place_repo.get_all_as_domain(db)
    places = [p for p in all_places if p.lat is not None and p.lon is not None]
    # all_history: List[DomainHistory] = history_repo.get_all_as_domain(db)
    # history = [p.id for p.id in all_history]

    # 1. Loại cứng theo Activity
    activity_repo = ActivityRepository(db)
    all_activities: List[Activity] = activity_repo.list_all()
    places = _filter_by_activity(places, criteria.activities, all_activities)

    if not places:
        return RecommendationResult(places=[])

    # 2. Loại cứng theo Hobby
    places = _filter_by_hobby(places, user.hobbies)

    if not places:
        return RecommendationResult(places=[])

    # 2. Loại cứng theo khoảng cách tối đa tùy vào duration_tag
    places = _filter_by_gps(places, criteria.location, criteria.duration_tag)

    if not places:
        return RecommendationResult(places=[])

    # 3. Lọc theo thời tiết
    weather = get_weather(criteria.location.latitude, criteria.location.longitude)
    places = _filter_by_weather(places, str(weather))

    # 4. Lọc theo thời gian: lọc các địa điểm không phù hợp thời gian(khi user kh chọn activity)
    hour = get_current_hour()
    if not criteria.activities:
        places = _filter_by_time_tag(places, hour)

    if not places:
        return RecommendationResult(places=[])

    # 5. Loại cứng theo giờ hoạt động
    places = _filter_by_opening_hours(places, hour)

    # 6. Tính điểm từng địa điểm
    history = []
    tags = tag_repo.get_all(db)
    scored: list[tuple[float, DomainPlace]] = []

    for place in places:
        total_score = _score_place(place, criteria, tags, history)
        scored.append((total_score, place))

    # Sắp xếp giảm dần theo điểm
    scored.sort(key=lambda x: x[0], reverse=True)

    # Chỉ lấy danh sách place (bỏ điểm)
    top_places = [place for _, place in scored[:5]]

    return RecommendationResult(places=top_places)


def _filter_by_activity(places: list[DomainPlace], user_activities: List[str], all_activities: List[Activity]):

    # Không có activity user → giữ nguyên
    if not user_activities:
        return places

    user_activity_set = set(user_activities)

    # Tập hợp activity code hợp lệ trong DB
    valid_activity_codes = {a.code for a in all_activities}

    filtered = []

    for p in places:
        # Lọc activity của place từ tags
        place_activity_set = {
            t for t in p.tags
            if t in valid_activity_codes
        }

        # Nếu có ít nhất 1 tag activity trùng với user
        if place_activity_set & user_activity_set:
            filtered.append(p)

    return filtered


def _filter_by_hobby(places: list[DomainPlace], hobbies: list[str]):
    """Loại bỏ địa điểm không có bất kỳ tag nào trùng với sở thích người dùng.
    - hobbies rỗng -> không lọc."""
    if not hobbies:
        return places

    hobby_set = set(hobbies)

    return [p for p in places if any(tag in hobby_set for tag in p.tags)]


max_distance_by_duration = {
    "#Moment": 5,
    "#FewHours": 10,
    "#LongTime": 20,
}

def _filter_by_gps(places: list[DomainPlace], loc: Location, duration_tag: str):
    out = []
    for p in places:
        try:
            d = haversine_distance(loc.latitude, loc.longitude, p.lat, p.lon)
        except:
            continue
        if d <= max_distance_by_duration.get(duration_tag):
            out.append(p)
    return out


EXTREME_WEATHER_TAGS = {"#rain", "#storm", "#snow"}
UNSAFE_SPACES_IN_EXTREME_WEATHER = {"#outdoor", "#rooftop"}


def _filter_by_weather(places: list[DomainPlace], weather: str):
    """
    Loại bỏ các địa điểm không phù hợp trong thời tiết cực đoan.
    - Nếu thời tiết thuộc EXTREME_WEATHER_TAGS -> loại mọi place chứa tag trong UNSAFE_SPACES_IN_EXTREME_WEATHER.
    """
    if weather in EXTREME_WEATHER_TAGS:
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


def _filter_by_time_tag(places: list[DomainPlace], hour: float):
    def time_to_tag(hour: float) -> str:
        """hour: 0–23
        Return: "morning" | "noon" | "night"""

        if 5 <= hour < 11:
            return "morning"
        elif 11 <= hour < 17:
            return "noon"
        else:
            return "night"

    time_tag = time_to_tag(hour)
    unsafe_tags = UNSAFE_BY_TIME_TAG.get(time_tag, set())

    return [
        p for p in places
        if not any(tag in unsafe_tags for tag in p.tags)
    ]


def _filter_by_opening_hours(places: list[DomainPlace], current_hour: float) -> list[DomainPlace]:
    """
    Trả về các địa điểm đang mở cửa tại current_hour.
    - Hỗ trợ mở qua đêm (vd 22 -> 03)
    - open == close -> coi là mở 24/7
    """

    def is_open_now(start: float, end: float, now: float) -> bool:
        """
        Kiểm tra giờ mở cửa.
        Nếu end < start -> mở qua đêm.
        Nếu start == end -> mở 24/7.
        """
        # Mở 24/7
        if start == end:
            return True

        # Mở - đóng trong cùng ngày
        if end > start:
            return start <= now <= end

        # Mở qua đêm (vd 21 -> 4)
        return now >= start or now <= end

    result = []

    for p in places:
        s = 0.0 # p.open
        e = 0.0 # p.close

        if s is None or e is None:
            continue

        if is_open_now(s, e, current_hour):
            result.append(p)

    return result


def _score_place(place: DomainPlace, criteria: RecommendationCriteria, tags: List[Tag], history: List[str]) -> float:
    total_score = 0.0

    # 6.1 Hobby tag matching - 50%
    total_score += _score_hobbies(criteria, place, tags)

    # 6.2 Distance - 30%
    total_score += _score_distance(criteria, place)

    # 6.3 Rating - 20%
    total_score += _score_rating(criteria, place)

    # 6.4 History penalty
    total_score *= 1 - _penalty_by_history(place, history)

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

    user_hobbies = criteria.extra_tags or []
    place_tags = place.tags or []

    if not user_hobbies:
        return 0.0

    # ----- Bảng tra cứu: tag_code -> group -----
    tag_group_map: dict[str, str] = {}
    for t in tags:
        if t.group:                      # chỉ nhận tag có group hợp lệ
            tag_group_map[t.id] = t.group

    # ----- Gom hobby user theo group -----
    user_by_group: dict[str, set[str]] = {}
    for code in user_hobbies:
        group = tag_group_map.get(code)
        if not group:
            continue
        user_by_group.setdefault(group, set()).add(code)

    # ----- Gom place tag theo group -----
    place_by_group: dict[str, set[str]] = {}
    for code in place_tags:
        group = tag_group_map.get(code)
        if not group:
            continue
        place_by_group.setdefault(group, set()).add(code)

    total_score = 0.0

    # ----- Tính điểm theo group -----
    for group, user_codes in user_by_group.items():
        weight = TAG_TYPE_WEIGHT.get(group, 0)
        if weight == 0:
            continue

        place_codes = place_by_group.get(group)
        if not place_codes:
            continue

        # số tag trùng
        match_count = len(user_codes.intersection(place_codes))
        if match_count == 0:
            continue

        # tổng số hobby user trong group
        total_user_tags = len(user_codes)

        # công thức chuẩn: (match / total_user_hobbies_group) * weight
        score = (match_count / total_user_tags) * weight
        total_score += score

    return total_score


def _score_distance(criteria: RecommendationCriteria, place: DomainPlace) -> float:
    distance = haversine_distance(criteria.location.latitude, criteria.location.longitude, place.lat, place.lon)
    max_distance = max_distance_by_duration.get(criteria.duration_tag)

    MAX_SCORE = 30.0

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


def _penalty_by_history(place: DomainPlace, history: List[str]) -> float:
    """Tính hệ số nhân điểm dựa trên lịch sử đề xuất.
    - Biến đếm chạy theo chu kỳ 0 → 1 → 2 → ... → 7 → 0 → ...
    - Khi biến đếm = 0 → giảm 0%
    - Khi biến đếm = 1 → giảm 70%, biến đếm = 2 → giảm 60%, ..., biến đếm = 7 → giảm 10%
    - Ở đây history là 1 list[str] các id"""
    MAX_COUNT = 7

    def count_occurrences(item: str, lst: List[str]) -> int:
        """Đếm số lần item xuất hiện trong list lst"""
        return lst.count(item)

    # Đếm số lần xuất hiện của từng place
    n = count_occurrences(str(place.id), history)

    # Biến đếm theo chu kỳ 0-7
    counter = n % (MAX_COUNT + 1)

    # Tính giảm điểm theo biến đếm
    penalty_percentage = max(0.0, (MAX_COUNT + 1 - counter) * 0.1 * (counter != 0))

    return penalty_percentage


def _to_api_dict(place: DomainPlace) -> dict:
    return {
        "id": place.id,
        "name": place.name,
        "address": place.address or "",
        "image_url": place.image or "",
        "description": place.overview or "",
        "tags": place.tags,
        "rating": place.rating or ""
    }