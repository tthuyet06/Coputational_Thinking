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
from backend.app.utils.weather_utils import get_weather
from backend.app.utils.time_utils import get_current_hour

user_repo = UserRepository()
place_repo = PlaceRepository()
# history_repo = HistoryRepository()

def get_recommendations(
    db: Session,
    latitude: float,
    longitude: float,
    duration_tag: str | None,
    user: models.User,
) -> List[Dict[str, Any]]:

    domain_user = user_repo.to_domain(user)

    criteria = RecommendationCriteria(
        location=Location(latitude=latitude, longitude=longitude),
        duration_tag=duration_tag,
        extra_tags=domain_user.hobbies,
    )

    result: RecommendationResult = _recommend_core(db, domain_user, criteria)

    return [_to_api_dict(p) for p in result.places]


def _recommend_core(db: Session, user: DomainUser, criteria: RecommendationCriteria) -> RecommendationResult:
    all_places: List[DomainPlace] = place_repo.get_all_as_domain(db)
    places = [p for p in all_places if p.lat is not None and p.lon is not None]
    # history = history_repo.get_all()

    # 1. Loại cứng theo Activity
    places = _filter_by_activity(places, criteria.activity)

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
    if not criteria.activity:
        places = _filter_by_time_tag(places, hour)

    if not places:
        return RecommendationResult(places=[])

    # 5. Loại cứng theo giờ hoạt động
    places = _filter_by_opening_hours(places, hour)


    # 6. Tính điểm từng địa điểm
    history = []
    scored: list[tuple[float, DomainPlace]] = []
    for place in places:
        tatal_score = _score_place(place, criteria, history)
        scored.append((tatal_score, place))

    scored.sort(key=lambda x: x[0], reverse=True)

    top_places = [p for _, p in scored[:5]]

    return RecommendationResult(places=top_places)

# tạm thời do chưa tách
def _filter_by_activity(places: list[DomainPlace], activity: List[str]):
    """Lọc danh sách địa điểm theo activity tag mà user chọn.
    Chỉ giữ lại những place có ít nhất 1 activity tag trùng.
    activity: List[str] (danh sách tag activity do user chọn)"""

    # nếu user không nhập activity -> không lọc
    if not activity:
        return places

    # convert sang set cho nhanh
    user_activity_tags = set(activity)

    filtered = []
    for p in places:
        # lấy ra toàn bộ activity tag của place
        place_activity_tags = {
            t for t in p.tags if TAG_TYPE_MAP.get(t) == "activity"
        }

        # nếu có giao nhau -> giữ lại
        if place_activity_tags & user_activity_tags:
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
    "#choc_lat": 5,
    "#vai_tieng": 10,
    "#nua_ngay": 20,
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
    - Hỗ trợ mở qua đêm (vd 22 → 03)
    - open_time == close_time → coi là mở 24/7
    """

    def is_open_now(start: float, end: float, now: float) -> bool:
        """
        Kiểm tra giờ mở cửa.
        Nếu end < start → mở qua đêm.
        Nếu start == end → mở 24/7.
        """
        # Mở 24/7
        if start == end:
            return True

        # Mở - đóng trong cùng ngày
        if end > start:
            return start <= now <= end

        # Mở qua đêm (vd 21 → 4)
        return now >= start or now <= end

    result = []

    for p in places:
        s = p.open_time
        e = p.close_time

        if s is None or e is None:
            continue

        if is_open_now(s, e, current_hour):
            result.append(p)

    return result


def _score_place(place: DomainPlace, criteria: RecommendationCriteria, history: List[str]) -> float:
    tatal_score = 0.0

    # 6.1 Hobby tag matching - 50%
    tatal_score += _score_hobbies(place.tags, criteria.extra_tags)

    # 6.2 Distance - 30%
    tatal_score += _score_distance(criteria, place)

    # 6.3 Rating - 20%
    tatal_score += _score_rating(criteria, place)

    # 6.4 History penalty
    tatal_score *= 1 - _penalty_by_history(place, history)

    return tatal_score


# Tạm thời do chưa tách activity
TAG_TYPE_MAP = {
    # --- activity ---
    "#cafe": "activity",
    "#milk_tea": "activity",
    "#snack": "activity",
    "#food": "activity",
    "#restaurant": "activity",
    "#healthy": "activity",
    "#buffet": "activity",
    "#bbq": "activity",
    "#seafood": "activity",
    "#bar": "activity",
    "#pub": "activity",
    "#dessert": "activity",
    "#sweet": "activity",
    "#streetfood": "activity",
    "#cheap_eats": "activity",
    "#quick_bite": "activity",
    "#late_night_food": "activity",
    "#takeaway": "activity",
    "#brunch": "activity",
    "#spicy_food": "activity",
    "#signature_dish": "activity",
    "#late_cafe": "activity",
    "#vegetarian": "activity",
    "#light_meal": "activity",
    "#work_cafe": "activity",
    "#hotpot": "activity",
    "#cultural_visit": "activity",

    # --- space ---
    "#indoor": "space",
    "#outdoor": "space",
    "#rooftop": "space",
    "#spacious": "space",
    "#small_space": "space",
    "#coffee_in_bed": "space",

    # --- special ---
    "#live_music": "special",
    "#acoustic": "special",
    "#workshop": "special",
    "#boardgame": "special",
    "#karaoke": "special",
    "#pet_friendly": "special",

    # --- style ---
    "#aesthetic": "style",
    "#creative": "style",
    "#vintage": "style",
    "#minimal": "style",
    "#indie": "style",
    "#street_style": "style",
    "#kstyle": "style",

    # --- time ---
    "#morning": "time",
    "#afternoon": "time",
    "#evening": "time",
    "#night": "time",
    "#late_night": "time",
    "#sunset": "time",
    "#moment": "time",
    "#few_hours": "time",
    "#long_time": "time",

    # --- vibe ---
    "#quiet": "vibe",
    "#chill": "vibe",
    "#vibrant": "vibe",
    "#romantic": "vibe",
    "#cozy": "vibe",
    "#luxury": "vibe",
    "#local_spot": "vibe",
    "#hidden_gem": "vibe",
    "#chinatown_vibe": "vibe",
    "#family_friendly": "vibe",
    "#date_spot": "vibe",
    "#solo_friendly": "vibe",
    "#group_friendly": "vibe",
    "#traditional": "vibe",
    "#ancient_vibe": "vibe",

    # --- view ---
    "#photo_spot": "view",
    "#view_spot": "view",
    "#river_view": "view",
    "#city_view": "view",

    # --- weather ---
    "#rain": "weather",
    "#sunny": "weather",
    "#windy": "weather",
    "#cloudy": "weather",
}

TAG_TYPE_WEIGHT = {
"space": 7,
"special": 5,
"style": 10,
"time": 5,
"vibe": 10,
"view": 8,
"weather": 5,
}

def _score_hobbies(place_tags: list[str], preferred_tags: list[str]) -> float:
    if not preferred_tags:
        return 0.0

    # Gom tag user theo type
    user_by_type = {}
    for tag in preferred_tags:
        t = TAG_TYPE_MAP.get(tag)
        if not t:
            continue
        user_by_type.setdefault(t, set()).add(tag)

    # Gom tag place theo type
    place_by_type = {}
    for tag in place_tags:
        t = TAG_TYPE_MAP.get(tag)
        if not t:
            continue
        place_by_type.setdefault(t, set()).add(tag)

    total_score = 0.0

    # Tính điểm cho từng type
    for tag_type, user_tags in user_by_type.items():
        weight = TAG_TYPE_WEIGHT.get(tag_type, 0)

        place_tags_in_type = place_by_type.get(tag_type, set())

        if not place_tags_in_type:
            continue

        # Số tag trùng
        match_count = len(user_tags.intersection(place_tags_in_type))

        if match_count == 0:
            continue

        # Số tag user có trong type
        total_user_tags = len(user_tags)

        type_score = (match_count / total_user_tags) * weight

        total_score += type_score

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
    """
    Tính điểm dựa trên rating của place.
    - rating tối đa 5 sao → tối đa 20 điểm
    """
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
    }