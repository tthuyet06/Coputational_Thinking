# distance.py
from fastapi import APIRouter, HTTPException, Query
from backend.app.services import distance_service

router = APIRouter(
    prefix="/distance",
    tags=["distance"]
)

@router.get("/")
async def get_distance(
        lat_origin: float = Query(..., ge=-90, le=90, description="Origin Latitude"),
        lon_origin: float = Query(..., ge=-180, le=180, description="Origin Longitude"),
        lat_dest: float = Query(..., ge=-90, le=90, description="Destination Latitude"),
        lon_dest: float = Query(..., ge=-180, le=180, description="Destination Longitude")
):
    """
    Calculate driving distance using OSRM (Open Source Routing Machine).
    Returns structured error codes if failed.
    """

    # 1. Call Service (Đã đổi tên hàm ở đây)
    result = distance_service.calculate_osrm_distance(
        lat_origin, lon_origin, lat_dest, lon_dest
    )

    # 2. Check Success
    if result["success"]:
        return result["data"]

    # 3. Handle Error (Dynamic Status Code)
    raise HTTPException(
        status_code=result["http_status"],
        detail={
            "error_code": result["error_code"],
            "message": result["message"]
        }
    )