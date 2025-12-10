import httpx
import re
import asyncio
from typing import Dict, Any
# Giả sử các import này vẫn được giữ nguyên
from backend.app.core.config import OSRM_API_URL
from backend.app.utils.geo_utils import haversine_distance

from backend.app.utils.geo_utils import haversine_distance

# Hàm Bất Đồng Bộ (ASYNC) được giữ nguyên vì nó sử dụng httpx.AsyncClient
async def calculate_osrm_distance(lat_origin: float, lon_origin: float, lat_dest: float, lon_dest: float):
    """Calculate driving distance using OSRM (Open Source Routing Machine) - ASYNC VERSION."""
    try:
        url = f"{OSRM_API_URL}/{lon_origin},{lat_origin};{lon_dest},{lat_dest}"

        params = {
            "overview": "false",
            "steps": "false"
        }

        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(url, params=params)

        if response.status_code != 200:
            status = response.status_code
            return {
                "success": False,
                "error_code": "OSRM_API_ERROR",
                "message": f"OSRM API Error: {status}",
                "http_status": status
            }

        data = response.json()
        if data.get("code") != "Ok":
            return {
                "success": False,
                "error_code": "ROUTE_NOT_FOUND",
                "message": "No route found.",
                "http_status": 404
            }

        route = data["routes"][0]
        distance_meters = route["distance"]
        distance_km = distance_meters / 1000

        # Chỉ trả về khoảng cách, đơn giản hóa cấu trúc trả về cho mục đích tính toán
        return {
            "success": True,
            "distance_km": distance_km
        }

    except httpx.RequestError as e:
        return {
            "success": False,
            "error_code": "CONNECTION_ERROR",
            "message": str(e),
            "http_status": 503
        }
    except Exception as e:
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
        return -1.0


# Loại bỏ hàm get_osrm_distance_in_km không cần thiết.
# Nó đã được hợp nhất vào hàm đồng bộ bên dưới để tiện lợi.

def get_distance_sync(lat_origin: float, lon_origin: float, lat_dest: float, lon_dest: float) -> float:
    """Hàm chính đồng bộ để tính khoảng cách OSRM hoặc khoảng cách Haversine dự phòng.
    Sử dụng asyncio.run() để thực thi tác vụ bất đồng bộ."""

    return haversine_distance(lat_origin, lon_origin, lat_dest, lon_dest) * 1.2

    # # Giá trị mặc định/dự phòng
    # fallback_distance = haversine_distance(lat_origin, lon_origin, lat_dest, lon_dest) * 1.2
    #
    # try:
    #     # Sử dụng asyncio.run() để gọi hàm async và lấy kết quả
    #     result: Dict[str, Any] = asyncio.run(
    #         calculate_osrm_distance(lat_origin, lon_origin, lat_dest, lon_dest)
    #     )
    #
    #     # Kiểm tra kết quả thành công
    #     if result.get("success") and "distance_km" in result:
    #         distance_km = result["distance_km"]
    #
    #         if distance_km > 0.0:
    #             # Trả về khoảng cách OSRM nếu thành công
    #             return distance_km
    #
    # except Exception as e:
    #     # Xử lý nếu asyncio.run() gặp lỗi (ví dụ: đang chạy trong ngữ cảnh event loop khác)
    #     print(f"Lỗi khi chạy asyncio.run: {e}")
    #     pass
    #
    # # Trả về khoảng cách dự phòng (Haversine * 1.2) nếu OSRM thất bại hoặc có lỗi
    # return fallback_distance