# backend/app/api/v1/endpoints/weather.py (Đã sửa)
from fastapi import APIRouter
# Bỏ import requests, OPENWEATHER_API_KEY
from backend.app.services import weather_service # <--- Thêm service mới

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
    # Logic đã chuyển sang weather_service
    return weather_service.get_current_weather_data(lat, lon)