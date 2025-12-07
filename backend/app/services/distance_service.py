# distance_service.py
import requests
from backend.app.core.config import OSRM_API_URL


def calculate_osrm_distance(lat_origin: float, lon_origin: float, lat_dest: float, lon_dest: float):
    """
    Calculate driving distance using OSRM (Open Source Routing Machine).
    """
    try:
        # OSRM yêu cầu format: {lon},{lat};{lon},{lat} (Lưu ý: Lon trước, Lat sau)
        url = f"{OSRM_API_URL}/{lon_origin},{lat_origin};{lon_dest},{lat_dest}"

        params = {
            "overview": "false",  # Không cần chi tiết từng ngã rẽ để nhẹ gánh
            "steps": "false"
        }

        response = requests.get(url, params=params, timeout=10)

        if response.status_code != 200:
            return {
                "success": False,
                "error_code": "OSRM_API_ERROR",
                "message": f"OSRM API Error: {response.status_code}",
                "http_status": 502
            }

        data = response.json()

        # OSRM trả về code "Ok" nếu thành công
        if data.get("code") != "Ok":
            return {
                "success": False,
                "error_code": "ROUTE_NOT_FOUND",
                "message": "No route found.",
                "http_status": 404
            }

        # Lấy route đầu tiên (tốt nhất)
        route = data["routes"][0]

        # Dữ liệu thô từ OSRM
        distance_meters = route["distance"]
        duration_seconds = route["duration"]

        # Tự format text (Google có sẵn, OSRM phải tự làm)
        distance_km = distance_meters / 1000
        duration_minutes = duration_seconds / 60

        distance_text = f"{distance_km:.1f} km"

        if duration_minutes >= 60:
            hours = int(duration_minutes // 60)
            mins = int(duration_minutes % 60)
            duration_text = f"{hours} hours {mins} mins"
        else:
            duration_text = f"{int(duration_minutes)} mins"

        return {
            "success": True,
            "data": {
                "origin_coordinates": f"{lat_origin}, {lon_origin}",
                "destination_coordinates": f"{lat_dest}, {lon_dest}",
                "distance_text": distance_text,
                "duration_text": duration_text,
            }
        }

    except requests.exceptions.RequestException as e:
        # Lỗi kết nối mạng
        return {
            "success": False,
            "error_code": "CONNECTION_ERROR",
            "message": str(e),
            "http_status": 503
        }
    except Exception as e:
        # Lỗi code Python khác
        return {
            "success": False,
            "error_code": "INTERNAL_SERVER_ERROR",
            "message": str(e),
            "http_status": 500
        }