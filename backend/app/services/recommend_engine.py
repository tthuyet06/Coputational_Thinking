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


def _recommend_core(
    db: Session,
    user: DomainUser,
    criteria: RecommendationCriteria,
) -> RecommendationResult:

    # 1. Lấy tất cả địa điểm
    all_places: List[DomainPlace] = place_repo.get_all_as_domain(db)
    places = [p for p in all_places if p.lat is not None and p.lon is not None]

    # 2. Duration tag: loại cứng theo khoảng cách tối đa
    max_dist = _max_distance(criteria.duration_tag)
    places = _filter_by_gps(places, criteria.location, max_dist, criteria.duration_tag)

    if not places:
        return RecommendationResult(places=[])

    # 3. Lấy thời tiết + giờ
    weather = get_weather(criteria.location.latitude, criteria.location.longitude)
    hour = get_current_hour()

    # 3. Weather boolean filtering: loại bỏ các place chứa #outdoor khi mưa, bão, tuyết
    places = _filter_by_weather(places, weather)

    if not places:
        return RecommendationResult(places=[])

    # 4. Tính điểm từng địa điểm
    scored: list[tuple[float, DomainPlace]] = []
    for place in places:
        score = _score_place(place, criteria, weather)
        scored.append((score, place))

    scored.sort(key=lambda x: x[0], reverse=True)

    top_places = [p for _, p in scored[:5]]

    return RecommendationResult(places=top_places)

def _score_place(
    place: DomainPlace,
    criteria: RecommendationCriteria,
    weather: str,
) -> float:

    score = 100.0   # khởi điểm

    # 4.1 Distance
    score -= _score_distance(criteria, place)

    # 4.2 Hobby tag matching
    score += _score_hobbies(place.tags, criteria.extra_tags)

    # 4.3 Indoor/outdoor weather bonus
    score += _score_weather(place.tags, weather)

    # 4.4 History penalty (đề xuất)
    # score -= _history_penalty(place.id, user)

    return score

max_distance_by_duration = {
    "#choc_lat": 2.5,
    "#vai_tieng": 5,
    "#nua_ngay": 12
}

def _max_distance(tag: str | None) -> float:
    return max_distance_by_duration.get(tag)

def _score_distance(criteria: RecommendationCriteria, place: DomainPlace) -> float:
    return haversine_distance(criteria.location.latitude, criteria.location.longitude, place.lat, place.lon) * 50

TAG_WEIGHTS = {
    # Time tags
    "#Morning": 2.0,
    "#Noon": 2.0,
    "#Evening": 2.0,
    "#Night": 1.0,
    "#LateNight": 3.0,
    "#GoldenHour": 1.0,
    "#LateAfternoon": 1.0,
    "#EarlyMorning": 1.0,

    # Weather tags
    "#SunnyDay": 1.0,
    "#RainyDay": 1.5,
    "#AfterRain": 1.2,
    "#CoolWeather": 1.0,
    "#PeacefulDay": 1.0,
}

def _score_hobbies(place_tags: list[str], preferred_tags: list[str]) -> float:
    if not preferred_tags:
        return 0.0

    total = 0
    for tag in preferred_tags:
        if tag in place_tags:
            total += TAG_WEIGHTS.get(tag)

    return total

WEATHER_INDOOR = {"#rain", "#storm", "#snow"}
WEATHER_OUTDOOR = {"#sunny", "#cloudy"}

def _score_weather(place_tags: list[str], weather: str) -> float:
    """
    Tính điểm dựa trên thời tiết:
    - Indoor: mưa/bão/tuyết tốt nhất
    - Outdoor: nắng/mây nhẹ tốt nhất
    """
    if "#indoor" in place_tags:
        if weather in WEATHER_INDOOR:
            return 20.0
        elif weather in WEATHER_OUTDOOR:
            return -10.0
        return 0.0

    if "#outdoor" in place_tags:
        if weather == "#sunny":
            return 20.0
        elif weather == "#cloudy":
            return 10.0
        elif weather in WEATHER_INDOOR:
            return -30.0
        return 0.0

    return 0.0


# def _history_penalty(place_id: int, user: DomainUser) -> float:
    """
    Nếu địa điểm được user recommend gần đây (≤ 3 ngày → penalty)
    domain_user.history = [(place_id, timestamp), ...]
    """
    for hid, ts in user.recommend_history:
        if hid == place_id:
            # Bạn muốn 3 ngày → penalty mạnh
            return 30.0
    return 0.0


def _filter_by_weather(places: list[DomainPlace], weather: str):
    """
    Trời mưa / bão / tuyết → loại toàn bộ outdoor.
    """
    if weather in WEATHER_INDOOR:
        return [p for p in places if "#outdoor" not in p.tags]
    return places


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


def _to_api_dict(place: DomainPlace) -> dict:
    return {
        "id": place.id,
        "name": place.name,
        "address": place.address or "",
        "image_url": place.image or "",
        "description": place.overview or "",
        "tags": place.tags,
    }