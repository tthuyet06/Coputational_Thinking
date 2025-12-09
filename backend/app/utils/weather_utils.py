import httpx
import os

OPENWEATHER_URL = "https://api.openweathermap.org/data/2.5/weather"


def normalize_weather_tag(main_weather: str) -> str:
    """
    Chuyển weather code của OpenWeather thành dạng "#sunny", "#rain"...
    """
    w = main_weather.lower()
    match w:
        case "clear":       return "#sunny"
        case "clouds":      return "#cloudy"
        case "rain":        return "#rain"
        case "drizzle":     return "#rain"
        case "thunderstorm":return "#storm"
        case "snow":        return "#snow"
        case _:             return "#unknown"


async def get_weather(latitude: float, longitude: float) -> str:
    """
    Gọi OpenWeather API để lấy điều kiện thời tiết hiện tại.
    Trả về dạng "#sunny", "#rain", "#storm", ...
    """
    api_key = os.getenv("OPENWEATHER_API_KEY")
    if not api_key:
        return "#unknown"

    params = {"lat": latitude, "lon": longitude, "appid": api_key}

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(OPENWEATHER_URL, params=params)
            data = resp.json()

        main_weather = data.get("weather", [{}])[0].get("main", "unknown")
        return normalize_weather_tag(main_weather)

    except Exception:
        return "#unknown"