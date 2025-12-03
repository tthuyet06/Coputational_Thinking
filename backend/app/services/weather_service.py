# backend/app/services/weather_service.py

from fastapi import HTTPException
import requests
from backend.app.core.config import OPENWEATHER_API_KEY
from typing import Dict, Any

def get_current_weather_data(lat: float, lon: float) -> Dict[str, Any]:
    """
    Gọi API OpenWeatherMap để lấy dữ liệu thời tiết hiện tại.
    """
    if not OPENWEATHER_API_KEY:
        raise HTTPException(status_code=500, detail="Server has not configured the API Key")

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

        # Xử lý lỗi API
        if response.status_code != 200:
            # Gửi lỗi OpenWeather lên, ví dụ: 401 Unauthorized, 400 Bad Request
            raise HTTPException(status_code=response.status_code, detail="Error from OpenWeather API")

        return response.json()

    except requests.exceptions.RequestException as e:
        # Lỗi kết nối mạng/timeout
        raise HTTPException(status_code=500, detail=f"Connection error: {str(e)}")