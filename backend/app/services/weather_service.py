# backend/app/services/weather_service.py

from fastapi import HTTPException
import requests
from backend.app.core.config import OPENWEATHER_API_KEY
from typing import Dict, Any

def get_empty_weather_data() -> Dict[str, Any]:
    """Trả về cấu trúc dữ liệu rỗng giả định để tránh lỗi KeyError/IndexError."""
    # Giá trị 'unknow_weather' sẽ được normalize_weather_tag chuyển thành #unknow_weather
    return {'weather': [{'main': 'unknow_weather'}]}

def get_current_weather_data(lat: float, lon: float) -> Dict[str, Any]:
    """
    Gọi API OpenWeatherMap để lấy dữ liệu thời tiết hiện tại.
    Luôn trả về Dict[str, Any]. Trả về dữ liệu rỗng giả định nếu có lỗi.
    """
    # Xử lý lỗi cấu hình API Key và trả về dữ liệu rỗng
    if not OPENWEATHER_API_KEY:
        # Không in, chỉ trả về dữ liệu rỗng
        return get_empty_weather_data()

    url = "https://api.openweathermap.org/data/2.5/weather"
    params = {
        'lat': lat,
        'lon': lon,
        'appid': OPENWEATHER_API_KEY,
        'units': 'metric',
        'lang': 'vi'
    }

    try:
        response = requests.get(url, params=params)

        # Xử lý lỗi API (ví dụ: 401, 400, 503)
        if response.status_code != 200:
            return get_empty_weather_data()  # Trả về dữ liệu rỗng khi OpenWeather báo lỗi

        # Xử lý trường hợp có thể dữ liệu json trả về không hợp lệ
        try:
            return response.json()
        except requests.exceptions.JSONDecodeError:
            return get_empty_weather_data()

    except requests.exceptions.RequestException:
        # Lỗi kết nối mạng/timeout
        return get_empty_weather_data()  # Trả về dữ liệu rỗng khi có lỗi kết nối

def get_main_weather(lat: float, lon: float) -> str:
    """Lấy dữ liệu thời tiết hiện tại và trả về tag thời tiết đã chuẩn hóa.
    Không có bất kỳ khối try/except nào."""
    # weather_data luôn là Dict[str, Any] và có cấu trúc 'weather'[0]['main']
    weather_data = get_current_weather_data(lat, lon)

    # Do hàm cấp dưới đã đảm bảo dữ liệu luôn có cấu trúc này,
    # chúng ta có thể truy cập trực tiếp mà không cần try/except.
    main_weather_status = weather_data['weather'][0]['main']

    # Chuẩn hóa và trả về tag
    return normalize_weather_tag(main_weather_status)

def normalize_weather_tag(main_weather: str) -> str:
    """Chuyển đổi giá trị 'main' của OpenWeatherMap thành tag chuẩn hóa.
    Nếu không khớp với các giá trị được định nghĩa, sẽ trả về tag
    viết thường với dấu # ở đầu."""
    w = main_weather.lower()

    match w:
        case "clear":
            return "#sunny"
        case "clouds":
            return "#cloudy"
        case "rain" | "drizzle":
            return "#rain"
        case "thunderstorm":
            return "#storm"
        case "snow":
            return "#snow"

        case "mist" | "smoke" | "haze" | "dust" | "fog" | "sand" | "ash":
            return "#misty"
        case "squall" | "tornado":
            return "#extreme"

        case _:
            return f"#{w}"