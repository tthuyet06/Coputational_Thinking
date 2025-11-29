import pytest
from unittest.mock import MagicMock, patch
from typing import List

# Giả định đường dẫn import đúng
# Thay thế dòng này bằng đường dẫn thực tế của module bạn đang test
from backend.app.services.recommend_engine import (
    _recommend_core,
    _score_place,
    _filter_by_gps,
    _filter_by_weather,
    _score_hobbies,
    _score_weather,
    _max_distance,  # Thêm
    _score_distance,  # Thêm
    _to_api_dict,  # Thêm
    max_distance_by_duration,
)
from backend.app.domain.user import User as DomainUser
from backend.app.domain.place import Place as DomainPlace
from backend.app.domain.location import Location
from backend.app.domain.recommendation import RecommendationCriteria
from backend.app.db.models import User as ModelUser  # Cần cho hàm get_recommendations


# --- Fixtures Dữ liệu Mock ---

@pytest.fixture
def mock_db():
    """Mock Session SQLAlchemy"""
    return MagicMock()


@pytest.fixture
def mock_user() -> DomainUser:
    """Mock DomainUser với sở thích mẫu"""
    return DomainUser(
        id=1,
        email="test@user.com",
        username="tester",
        hobbies=["#CoolWeather", "#Night"]
    )


@pytest.fixture
def loc_hcm() -> Location:
    """Vị trí hiện tại giả định (TP HCM)"""
    return Location(latitude=10.7769, longitude=106.7009)


@pytest.fixture
def mock_places() -> List[DomainPlace]:
    """Danh sách các địa điểm mẫu"""
    return [
        DomainPlace(
            id=1, name="Cafe A (Gần, Indoor)", lat=10.778, lon=106.702,
            address="123 ABC", image="img1.jpg", overview="view 1",
            tags=["#indoor", "#Night", "#CoolWeather"]
        ),
        DomainPlace(
            id=2, name="Công viên B (Gần, Outdoor)", lat=10.78, lon=106.705,
            address="456 XYZ", image="img2.jpg", overview="view 2",
            tags=["#outdoor", "#Morning", "#PeacefulDay"]
        ),
        DomainPlace(
            id=3, name="Điểm C (Xa, Indoor)", lat=10.90, lon=106.80,
            address="789 LMN", image=None, overview=None,
            tags=["#indoor", "#RainyDay"]
        ),
        DomainPlace(
            id=4, name="Quán D (Gần, Indoor)", lat=10.777, lon=106.701,
            address="000 DEF", image="img4.jpg", overview="view 4",
            tags=["#indoor", "#LateNight"]
        ),
    ]


# --- Kiểm thử Hàm Lõi _recommend_core (Giữ nguyên) ---

@patch('backend.app.services.recommend_engine.get_weather')
@patch('backend.app.services.recommend_engine.get_current_hour', return_value=10)
@patch('backend.app.services.recommend_engine.place_repo')
@patch('backend.app.services.recommend_engine.haversine_distance')
def test_recommend_core_flow(
        mock_haversine, mock_place_repo, mock_get_hour, mock_get_weather,
        mock_db, mock_user, loc_hcm, mock_places
):
    # Thiết lập mock:
    mock_place_repo.get_all_as_domain.return_value = mock_places
    mock_get_weather.return_value = "#cloudy"  # Thời tiết giả định

    # Giả định khoảng cách để vượt qua bước lọc GPS
    # Địa điểm 1, 2, 4 gần (trong max_dist), Địa điểm 3 xa
    mock_haversine.side_effect = lambda lat1, lon1, lat2, lon2: {
        (loc_hcm.latitude, loc_hcm.longitude, 10.778, 106.702): 0.3,  # Gần
        (loc_hcm.latitude, loc_hcm.longitude, 10.78, 106.705): 0.5,  # Gần
        (loc_hcm.latitude, loc_hcm.longitude, 10.90, 106.80): 15.0,  # Xa
        (loc_hcm.latitude, loc_hcm.longitude, 10.777, 106.701): 0.1,  # Rất gần
    }.get((lat1, lon1, lat2, lon2), 0)

    criteria = RecommendationCriteria(
        location=loc_hcm,
        duration_tag="#nua_ngay",  # Max distance 12
        extra_tags=mock_user.hobbies,
    )

    result = _recommend_core(mock_db, mock_user, criteria)

    assert len(result.places) == 3  # 1, 2, 4 được giữ lại
    assert mock_places[2] not in result.places


# ------------------------------------------
# --- Kiểm thử Các Hàm Tiện Ích Mới Thêm ---
# ------------------------------------------

## Kiểm thử _max_distance
def test_max_distance_valid_tag():
    """Kiểm tra trả về khoảng cách tối đa cho tag hợp lệ."""
    assert _max_distance("#choc_lat") == 2.5
    assert _max_distance("#nua_ngay") == 12


def test_max_distance_invalid_tag():
    """Kiểm tra trả về None cho tag không hợp lệ."""
    assert _max_distance("#unknown_tag") is None


## Kiểm thử _score_distance
@patch('backend.app.services.recommend_engine.haversine_distance')
def test_score_distance_calculation(mock_haversine, loc_hcm, mock_places):
    """Kiểm tra tính điểm khoảng cách."""
    # Giả định khoảng cách trả về là 2.0 km
    mock_haversine.return_value = 2.0

    criteria = RecommendationCriteria(location=loc_hcm, duration_tag="#vai_tieng", extra_tags=[])

    # Công thức: distance * 50.0. Score = 2.0 * 50.0 = 100.0
    score = _score_distance(criteria, mock_places[0])

    assert score == 100.0
    mock_haversine.assert_called_once_with(
        criteria.location.latitude, criteria.location.longitude,
        mock_places[0].lat, mock_places[0].lon
    )


## Kiểm thử _to_api_dict
def test_to_api_dict_full_data(mock_places):
    """Kiểm tra ánh xạ DomainPlace sang Dict API khi có đầy đủ dữ liệu."""
    place = mock_places[0]
    api_dict = _to_api_dict(place)

    assert api_dict["id"] == 1
    assert api_dict["name"] == "Cafe A (Gần, Indoor)"
    assert api_dict["address"] == "123 ABC"
    assert api_dict["image_url"] == "img1.jpg"
    assert api_dict["description"] == "view 1"
    assert api_dict["tags"] == ["#indoor", "#Night", "#CoolWeather"]


def test_to_api_dict_partial_data(mock_places):
    """Kiểm tra ánh xạ DomainPlace sang Dict API khi thiếu ảnh/mô tả."""
    place = mock_places[2]
    api_dict = _to_api_dict(place)

    # Kiểm tra giá trị mặc định ("" hoặc None)
    assert api_dict["image_url"] == ""  # Nếu place.image là None, nên trả về ""
    assert api_dict["description"] == ""  # Nếu place.overview là None, nên trả về ""


# --------------------------------------
# --- Kiểm thử Các Hàm Chấm Điểm Khác ---
# --------------------------------------

## Kiểm thử _filter_by_gps (Cập nhật - Xử lý ngoại lệ)
def test_filter_by_gps_handles_exception(loc_hcm, mock_places):
    """Kiểm tra xử lý ngoại lệ khi haversine_distance thất bại (ví dụ: lat/lon None)."""

    # Địa điểm 3 có lat/lon nhưng ta giả lập lỗi để test khối try/except
    with patch('backend.app.services.recommend_engine.haversine_distance') as mock_dist:
        # Mock sao cho chỉ địa điểm đầu tiên tính được khoảng cách, còn lại lỗi
        def side_effect(lat1, lon1, lat2, lon2):
            if lat2 == 10.778:
                return 1.0
            raise Exception("Lỗi giả lập khoảng cách")

        mock_dist.side_effect = side_effect

        filtered = _filter_by_gps(mock_places, loc_hcm, "#nua_ngay")

        # Chỉ có Địa điểm 1 (Cafe A) được giữ lại vì các địa điểm khác gây lỗi
        assert len(filtered) == 1
        assert filtered[0].id == 1

        # Các kiểm thử khác (hobbies, weather, filter_by_weather) giữ nguyên như đã cung cấp.