import time
from typing import List, Dict, Any
from sqlalchemy.orm import Session

import sys
import os
from dataclasses import dataclass # Khuyến nghị

# Tính toán đường dẫn gốc của dự án (Computonal_Thinking)
# os.path.dirname(_file_) là services/
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
from backend.app.domain.activity import Activity
from backend.app.domain.recommendation import (
    RecommendationCriteria,
    RecommendationResult,
)
from backend.app.repositories import (
    UserRepository,
    PlaceRepository,
    ActivityRepository,
    FavoriteRepository
)

from backend.app.services.weather_service import get_main_weather
from backend.app.services.place_service import _is_time_in_range, is_open_at
from backend.app.services.distance_service import  get_distance_sync
from backend.app.utils.time_utils import get_current_datetime, from_decimal_hours, sum_of_time, combine_date_time

user_repo = UserRepository()
place_repo = PlaceRepository()
fav_repo = FavoriteRepository()

@dataclass
class JSON_DATA:
    place: DomainPlace
    is_fav: bool

def get_recommendations(
    db: Session,
    latitude: float,
    longitude: float,
    duration_tag: str | None,
    activities: List[str],
    hobbies: List[str],
    user: models.User,
) -> List[dict]:

    domain_user = user_repo.to_domain(user)

    criteria = RecommendationCriteria(
        location=Location(latitude=latitude, longitude=longitude),
        duration_tag=duration_tag,
        activities=activities,
        extra_tags=hobbies,
    )

    result: RecommendationResult = _recommend_core(db, domain_user, criteria)

    json_datas = []

    for p in result.places:
        if fav_repo.is_favorite(db, domain_user.id, p.id):
            json_datas.append(JSON_DATA(place=p, is_fav=True))

    return [_to_api_dict(jt) for jt in json_datas]

def _recommend_core(db: Session, user: DomainUser, criteria: RecommendationCriteria, n_results: int = 2):
    all_places: List[DomainPlace] = place_repo.get_all_as_domain(db)
    places = [p for p in all_places if p.lat is not None and p.lon is not None]

    scored: list[tuple[float, float, DomainPlace]] = []

    # 0. Kiểm tra đầu vào ban đầu
    if not places:
        print("[INIT] FAIL ❌ — No places loaded.")
        return scored
    print(f"[INIT] OK ✅ — Loaded {len(places)} places.")

    # 1. Lọc theo Activity
    places = _filter_by_activity(places, criteria.activities)

    if not places:
        print("[ACTIVITY] FAIL ❌ — No places match the selected activities.")
        return scored
    print(f"[ACTIVITY] OK ✅ — {len(places)} places remain.")

    # 2. Lọc theo Hobby
    places = _filter_by_hobby(places, criteria.extra_tags)

    if not places:
        print("[HOBBY] FAIL ❌ — No places match the selected hobbies.")
        return scored
    print(f"[HOBBY] OK ✅ — {len(places)} places remain.")

    # 3. Lọc theo Weather
    places = _filter_by_weather(criteria, places)

    if not places:
        print("[WEATHER] FAIL ❌ — No places are suitable for current weather.")
        return scored
    print(f"[WEATHER] OK ✅ — {len(places)} places remain.")

    # 4. Khi user không chọn Activity
    if not criteria.activities:
        print("[NO_ACTIVITY] INFO — Filtering by time of day + current location")

        # Time of day
        places = _filter_by_time_of_day(places)
        if not places:
            print("[TIME_OF_DAY] FAIL ❌ — No places match time of day.")
            return scored
        print(f"[TIME_OF_DAY] OK ✅ — {len(places)} places remain.")

        # Current Location
        places = _filter_out_current_location(db, criteria, places)
        if not places:
            print("[CURRENT_LOCATION] FAIL ❌ — All places filtered out.")
            return scored
        print(f"[CURRENT_LOCATION] OK ✅ — {len(places)} places remain.")
    else:
        print("[ACTIVITY] INFO — Activities provided -> skipping fallback flow.")

    # 5. Lọc theo Opening Time
    places = _filter_by_opening_time(db, places)

    if not places:
        print("[OPENING_TIME] FAIL ❌ — No places open at this time.")
        return scored
    print(f"[OPENING_TIME] OK ✅ — {len(places)} places remain.")

    # 6. Lọc theo Distance (GPS)
    places = _filter_by_gps(places, criteria.location, criteria.duration_tag)

    if not places:
        print("[DISTANCE] FAIL ❌ — No places within allowed travel distance.")
        return scored
    print(f"[DISTANCE] OK ✅ — {len(places)} places remain.")

    if len(places) == 1:
        scored.append((_score_place(places[0], criteria, db, user), 0.0, places[0]))
        return scored

    # 7. Tính điểm từng địa điểm
    print(f"waiting for scoring....")

    for place in places:
        distance = get_distance_sync(criteria.location.latitude, criteria.location.longitude, place.lat, place.lon)
        total_score = _score_place(place, criteria, db, user)
        scored.append((total_score, distance, place))

    print(f"[{len(places)}] Counting Score success✅")
    # Sắp xếp giảm dần theo điểm
    scored.sort(key=lambda x: x[0], reverse=True)

    # Cắt (slice) danh sách để chỉ lấy N kết quả hàng đầu
    top_n_scored_data = scored[:n_results]

    # Trả về Top N kết quả đã sắp xếp
    return top_n_scored_data

def _filter_by_activity(places: list[DomainPlace], activities: List[str]) -> list[DomainPlace]:
    if not activities:
        return places

    required_activities_set = set(activities)

    return [
        p for p in places
        if required_activities_set.issubset(set(p.tags))
    ]

def _filter_by_hobby(places: list[DomainPlace], hobbies: list[str]):
    if not hobbies:
        return places

    return [p for p in places if p.match_any_tags(hobbies)]

Duration_Data = {
    "#moment": {
        "max_distance": 3.0,
        "min_stay_time": 0.25,
    },

    "#few_hours": {
        "max_distance": 7.0,
        "min_stay_time": 1.0,
    },

    "#long_time": {
        "max_distance": 15.0,
        "min_stay_time": 3.0,
    },
}

def _filter_by_gps(places: list[DomainPlace], loc: Location, duration_tag: str):
    max_distance_by_duration = Duration_Data.get(duration_tag, {}).get("max_distance")
    if max_distance_by_duration is None:
        return places

    out = []
    for p in places:
        d = get_distance_sync(loc.latitude, loc.longitude, p.lat, p.lon)
        if d <= max_distance_by_duration:
            out.append(p)
    return out

EXTREME_WEATHER_TAGS = {"#rain", "#storm", "#snow", "#misty", "#extreme"}
UNSAFE_SPACES_IN_EXTREME_WEATHER = {"#outdoor", "#rooftop"}

def _filter_by_weather(criteria: RecommendationCriteria, places: list[DomainPlace]):
    """Loại bỏ các địa điểm không phù hợp trong thời tiết cực đoan.
    - Nếu thời tiết thuộc EXTREME_WEATHER_TAGS -> loại mọi place chứa tag trong UNSAFE_SPACES_IN_EXTREME_WEATHER."""
    weather_tag = get_main_weather(criteria.location.latitude, criteria.location.longitude)

    if weather_tag in EXTREME_WEATHER_TAGS:
        return [
            p for p in places
            if not any(tag in UNSAFE_SPACES_IN_EXTREME_WEATHER for tag in p.tags)
        ]

    return places

UNSAFE_BY_TIME_TAG = {
    # Sáng (#morning): Outdoor được đề xuất. Cấm các vibe quá tĩnh lặng, lãng mạn, kịch tính, VÀ không gian trong nhà.
    "#morning": {
        "#quiet",      # Quá tĩnh lặng
        "#romantic",   # Vibe thường dành cho buổi tối
        "#dramatic",    # Vibe quá mạnh
        "#indoor"      # Cấm không gian trong nhà (vì ưu tiên Outdoor)
    },

    # Trưa/Chiều (#noon): Cấm các Không gian/Vibe không phù hợp với nhu cầu nhanh chóng hoặc tránh nắng.
    "#noon": {
        "#rooftop",    # Tránh nắng gắt buổi trưa
        "#romantic",   # Vibe quá lãng mạn
        "#dreamy",     # Vibe thường hợp với tối/chiều muộn
        "#quiet",      # Không phù hợp nếu cần địa điểm ăn trưa/làm việc năng động
        "#luxury"      # Tránh các địa điểm yêu cầu thời gian dài và sang trọng
    },

    # Tối (#night): Cấm các Không gian/Vibe quá mộc mạc/vắng vẻ, không phù hợp đi chơi đêm.
    "#night": {
        "#cafe",           # Cafe đêm ảnh hưởng sức khỏe
        "#outdoor",        # Có thể không an toàn/tiện lợi (Trừ #rooftop)
        "#natural",        # Vắng vẻ, không phù hợp đi chơi tối
        "#free_spirited",  # Có thể dẫn đến nơi vắng vẻ/không an toàn
        "#rustic"          # Vibe quá mộc mạc/thiếu ánh sáng
    }
}

def _filter_by_time_of_day(places: list[DomainPlace]):

    def time_to_tag(time_t: time) -> str:
        """hour: 0–23
        Return: "morning" | "noon" | "night"""
        if _is_time_in_range(time_t, time(5, 0), time(11, 0, 0)):
            return "#morning"
        elif _is_time_in_range(time_t, time(11, 0, 0), time(17, 0, 0)):
            return "#noon"
        else:
            return "#night"

    current_hours = get_current_datetime().time()
    time_tag = time_to_tag(current_hours)
    unsafe_tags = UNSAFE_BY_TIME_TAG.get(time_tag)

    return [
        p for p in places
        if not any(tag in unsafe_tags for tag in p.tags)
    ]

def _filter_out_current_location(db: Session, criteria: RecommendationCriteria, places: list[DomainPlace]) -> list[DomainPlace]:
    """
    Loại bỏ tất cả các địa điểm có activity tag trùng với activity tag
    của các địa điểm nằm trong phạm vi 0.01 km xung quanh current_location.

    Logic:
    1. Tìm các Place rất gần (<= 0.01 km).
    2. Thu thập TẤT CẢ các activity tag từ các Place đó (Banned Tags).
    3. Loại bỏ mọi Place chứa bất kỳ Banned Tag nào.
    """
    RADIUS_TO_EXCLUDE_KM = 0.01 # sai số

    current_lat = criteria.location.latitude
    current_lon = criteria.location.longitude

    all_tags = tag_repo.get_all(db)

    all_activities_tags = {t.id for t in all_tags if t.group == "activity"}

    banned_activity_tags: set[str] = set()

    for place in places:
        distance = get_distance_sync(current_lat, current_lon, place.lat, place.lon)

        # Kiểm tra nếu địa điểm cực kỳ gần
        if distance <= RADIUS_TO_EXCLUDE_KM:
            for tag in place.tags:
                if tag in all_activities_tags:
                    banned_activity_tags.add(tag)

    if not banned_activity_tags:
        # Nếu không có địa điểm nào gần, không cần lọc
        return places

    # BƯỚC 3: Loại bỏ tất cả các địa điểm chứa Banned Tags
    filtered_places: list[DomainPlace] = []

    for place in places:
        # Kiểm tra xem Place có chứa bất kỳ tag nào trong danh sách cấm hay không
        has_banned_tag = any(tag in banned_activity_tags for tag in place.tags)

        if not has_banned_tag:
            filtered_places.append(place)

    return filtered_places

def _filter_by_opening_time(db: Session, places: list[DomainPlace]) -> list[DomainPlace]:
    """Trả về các địa điểm đang mở cửa tại thời điểm hiện tại.
    - Sử dụng logic ưu tiên Special Rules > Weekly Ranges, bao gồm mở qua đêm."""
    current_time = get_current_datetime()

    open_places: List[DomainPlace] = []

    for p in places:
        place, weekly_ranges = place_repo.get_place_with_schedule(p.id, db)

        try:
            is_open = is_open_at(
                weekly_ranges=weekly_ranges,
                at=current_time,
            )
        except Exception as e:
            continue

        if is_open:
            open_places.append(place)

    return open_places

def _score_place(place: DomainPlace, criteria: RecommendationCriteria, db: Session, user: DomainUser) -> float:
    total_score = 0.0 # max total score = 10.0

    # 7.1 Hobby tag matching - 50%
    total_score += _score_hobbies(criteria, place, db)

    # 7.2 Distance - 20%
    total_score += _score_distance(criteria, place)

    # 7.3 Rating - 20%
    total_score += _score_rating(place)

    # 7.4 Duration - 10%
    total_score += _score_time_relevance(db, criteria, place)

    # 7.5 History penalty
    total_score *= 1 - _penalty_by_history(place, user)

    return total_score

def _score_hobbies(criteria: RecommendationCriteria, place: DomainPlace, db: Session) -> float:
    if not criteria.extra_tags:
        return 0.0

    MAX_SCORE = 5.0
    counting_match = 0

    for t in criteria.extra_tags:
        if place.has_tag(t):
            counting_match += 1

    score = MAX_SCORE * float(counting_match / len(criteria.extra_tags))

    return score

def _score_distance(criteria: RecommendationCriteria, place: DomainPlace) -> float:
    distance = get_distance_sync(criteria.location.latitude, criteria.location.longitude, place.lat, place.lon)
    max_distance = Duration_Data.get(criteria.duration_tag).get("max_distance")

    MAX_SCORE = 2.0

    if max_distance <= 3:
        if distance <= 1:
            return 0.7 * MAX_SCORE
        elif distance <= 3:
            return 0.3 * MAX_SCORE

    elif max_distance <= 7:
        if distance <= 3:
            return 0.5 * MAX_SCORE
        elif distance <= 5:
            return 0.35 * MAX_SCORE
        elif distance <= 7:
            return 0.15 * MAX_SCORE

    elif max_distance <= 15:
        if distance <= 5:
            return 0.4 * MAX_SCORE
        elif distance <= 7:
            return 0.4 * MAX_SCORE
        elif distance <= 15:
            return 0.2 * MAX_SCORE

    return 0.0

def _score_rating(place: DomainPlace) -> float:
    """Tính điểm dựa trên rating của place.
    - rating tối đa 5 sao -> tối đa 20 điểm"""
    MAX_POINTS = 2.0
    return (place.rating / 5.0) * MAX_POINTS

def _score_time_relevance(db: Session, criteria: RecommendationCriteria, place: DomainPlace) -> float:
    MAX_SCORE = 1.0

    current_hour = get_current_datetime().time()
    min_stay_time = float(Duration_Data.get(criteria.duration_tag).get("min_stay_time"))

    end_hour = sum_of_time(current_hour, from_decimal_hours(min_stay_time))
    current_date = get_current_datetime().date()

    end_time = combine_date_time(current_date, end_hour)
    p, weekly_ranges = place_repo.get_place_with_schedule(place.id, db)

    try:
        is_open = is_open_at(
            weekly_ranges=weekly_ranges,
            at=end_time,
        )
    except Exception as e:
        return 0.0

    if is_open:
        return MAX_SCORE

    return 0.0

def _penalty_by_history(place: DomainPlace, user: DomainUser) -> float:
    MAX_COUNT = 7

    n = user.get_reco_count_by_place_id(place.id)
    if n <= MAX_COUNT:
        return n * 0.1

    # Nếu count lỗi(out of range [0,7] - data lỗi thì giữ nguyên
    return 0

def _to_api_dict(jason_data: JSON_DATA) -> dict:
    place = jason_data.place
    is_fav = jason_data.is_fav
    return {
        "Favorite": is_fav,
        "id": place.id,
        "name": place.name,
        "address": place.address or "",
        "overview":place.overview or "",
        "image": place.image or "",
        "summarization": place.summarization or "",
        "tags": place.tags,
        "rating": place.rating or "",
        "open": place.open or "",
    }