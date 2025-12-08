
import httpx  # Thay thế requests
import re
import asyncio
from typing import Dict, Any
from backend.app.core.config import OSRM_API_URL

from backend.app.utils.geo_utils import haversine_distance

# THAY ĐỔI: Hàm bất đồng bộ (async)
async def calculate_osrm_distance(lat_origin: float, lon_origin: float, lat_dest: float, lon_dest: float):
    """Calculate driving distance using OSRM (Open Source Routing Machine) - ASYNC VERSION."""
    try:
        url = f"{OSRM_API_URL}/{lon_origin},{lat_origin};{lon_dest},{lat_dest}"

        params = {
            "overview": "false",
            "steps": "false"
        }

        # Sử dụng AsyncClient. Đặt timeout ngắn hơn (ví dụ 5 giây) để phát hiện lỗi nhanh hơn.
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(url, params=params)

        # Xử lý các mã lỗi HTTP không thành công (ví dụ: 404, 500, 429)
        if response.status_code != 200:
            status = response.status_code
            print(f"DEBUG: Lỗi OSRM API: HTTP {status}")
            return {
                "success": False,
                "error_code": "OSRM_API_ERROR",
                "message": f"OSRM API Error: {status}",
                "http_status": status
            }

        data = response.json()
        if data.get("code") != "Ok":
            print("DEBUG: Lỗi OSRM: ROUTE_NOT_FOUND")
            return {
                "success": False,
                "error_code": "ROUTE_NOT_FOUND",
                "message": "No route found.",
                "http_status": 404
            }

        # Lấy route đầu tiên (tốt nhất)
        route = data["routes"][0]
        distance_meters = route["distance"]
        duration_seconds = route["duration"]
        distance_km = distance_meters / 1000
        duration_minutes = duration_seconds / 60

        distance_text = f"{distance_km:.1f}"

        if duration_minutes >= 60:
            hours = int(duration_minutes // 60)
            mins = int(duration_minutes % 60)
            duration_text = f"{hours} hours {mins} mins"
        else:
            duration_text = f"{int(duration_minutes)} mins"

        # print("DEBUG: Kết thúc gọi OSRM - Thành công")
        return {
            "success": True,
            "data": {
                "origin_coordinates": f"{lat_origin}, {lon_origin}",
                "destination_coordinates": f"{lat_dest}, {lon_dest}",
                "distance_text": distance_text,
                "duration_text": duration_text,
            }
        }

    # Bắt lỗi kết nối mạng (Timeout, DNS, Connection refused, v.v.)
    except httpx.RequestError as e:
        # print(f"DEBUG: Lỗi kết nối/Timeout: {type(e).__name__} - {str(e)}")
        return {
            "success": False,
            "error_code": "CONNECTION_ERROR",
            "message": str(e),
            "http_status": 503
        }
    except Exception as e:
        # print(f"DEBUG: Lỗi nội bộ: {type(e).__name__} - {str(e)}")
        return {
            "success": False,
            "error_code": "INTERNAL_SERVER_ERROR",
            "message": str(e),
            "http_status": 500
        }

def extract_distance_regex(distance_str: str) -> float:
    """Sử dụng biểu thức chính quy để trích xuất số thực đầu tiên trong chuỗi."""
    match = re.search(r'\d+\.?\d*', distance_str)
    if match:
        return float(match.group(0))
    else:
        return -1.0 # báo lỗi cho get_osrm_distance_in_km


async def get_osrm_distance_in_km(lat_origin: float, lon_origin: float, lat_dest: float, lon_dest: float) -> float:
    """Tính khoảng cách lái xe bằng OSRM. Trả về khoảng cách thực tế (float).
    Trả về 100.0 km nếu có bất kỳ lỗi nào xảy ra (API thất bại, Timeout, hoặc trích xuất không thành công)."""

    # 1. Gọi hàm bất đồng bộ
    result: Dict[str, Any] = await calculate_osrm_distance(lat_origin, lon_origin, lat_dest, lon_dest)

    # 2. Kiểm tra thành công và trích xuất dữ liệu
    if result.get("success") and "data" in result:
        try:
            distance_text = result["data"]["distance_text"]
            distance_km = extract_distance_regex(distance_text)

            # *TRẢ VỀ NGAY LẬP TỨC NẾU THÀNH CÔNG VÀ KẾT QUẢ > 0*
            if distance_km > 0.0:
                return distance_km

        except:
            # Bất kỳ lỗi nào trong quá trình truy cập key hay trích xuất đều bị bỏ qua.
            pass

    return haversine_distance(lat_origin, lon_origin, lat_dest, lon_dest) * 0.8

def get_distance_sync(lat_origin: float, lon_origin: float, lat_dest: float, lon_dest: float) -> float:
    """
    Hàm giả lập đồng bộ để tính khoảng cách OSRM.
    Sử dụng asyncio.run() để chạy hàm async get_osrm_distance_in_km.
    """
    try:
        distance = asyncio.run(
            get_osrm_distance_in_km(lat_origin, lon_origin, lat_dest, lon_dest)
        )

        return distance

    except:
        # Bất kỳ lỗi nào trong quá trình truy cập key hay trích xuất đều bị bỏ qua.
        pass

    return haversine_distance(lat_origin, lon_origin, lat_dest, lon_dest) * 0.8