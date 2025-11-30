from fastapi import APIRouter, HTTPException
import requests
from backend.app.core.config import OPENWEATHER_API_KEY

router = APIRouter(
    prefix="/weather",
    tags=["weather"]
)

@router.get("/current")
async def get_current_weather(lat: float, lon: float):
    """
    Lấy thời tiết hiện tại dựa trên tọa độ GPS
    URL gọi: GET /api/v1/weather/current?lat=...&lon=...
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

        # Nếu OpenWeather trả về lỗi (ví dụ sai key, sai tọa độ)
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="Error from OpenWeather")

        return response.json()

    except requests.exceptions.RequestException as e:
        # Lỗi kết nối mạng
        raise HTTPException(status_code=500, detail=f"Connection error: {str(e)}")