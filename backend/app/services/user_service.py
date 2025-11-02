
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel, EmailStr

app = FastAPI(title="MoodyTrip — User Mock API (1-file)")
router = APIRouter(prefix="/api/users", tags=["users (mock)"])

# =========================
# Mock data (in-memory)
# =========================
# - _mock_users: kho user giả (key = id)
# - _mock_places: kho địa điểm giả (dùng cho favorites)
_mock_users: Dict[int, Dict[str, Any]] = {
    1: {
        "id": 1,
        "email": "alice@example.com",
        "full_name": "Alice Nguyen",
        "hobbies": ["#cafe", "#yen_tinh"],
        "favorites": [1],
    },
    2: {
        "id": 2,
        "email": "bob@example.com",
        "full_name": "Bob Tran",
        "hobbies": ["#song_ao", "#vai_tieng"],
        "favorites": [],
    },
}

_mock_places: List[Dict[str, Any]] = [
    {
        "id": 1,
        "name": "Cà phê XYZ",
        "address": "123 Đường ABC",
        "image_url": "https://example.com/cafe.jpg",
        "description": "Không gian yên tĩnh, phù hợp làm việc.",
        "tags": ["#cafe", "#yen_tinh", "#vai_tieng"],
    },
    {
        "id": 2,
        "name": "Phố đi bộ",
        "address": "Quận 1",
        "image_url": "https://example.com/street.jpg",
        "description": "Sôi động buổi tối, nhiều góc chụp.",
        "tags": ["#song_ao", "#soi_dong", "#nua_ngay"],
    },
]
# ============================================================
# KHO TAG SỞ THÍCH & TAG THỜI LƯỢNG (mock)
# ------------------------------------------------------------
# Hai hàm dưới chuẩn hoá nguồn tag để endpoint dùng thống nhất.
# Khi cần, thay nội dung bằng query DB hoặc file cấu hình.
# ============================================================

def list_hobby_tags() -> List[str]:
    """Trả về toàn bộ tag sở thích hợp lệ (để validate input / render UI)."""
    return ["#an_chinh", "#an_vat", "#cafe", "#van_hoa", "#yen_tinh", "#soi_dong", "#song_ao"]

def list_duration_tags() -> List[Dict[str, str]]:
    """Trả về danh sách tag thời lượng (display_name + tag_id) cho trang chủ."""
    return [
        {"display_name": "Dưới 1 tiếng", "tag_id": "#choc_lat"},
        {"display_name": "2-3 tiếng",    "tag_id": "#vai_tieng"},
        {"display_name": "Nửa ngày",     "tag_id": "#nua_ngay"},
    ]

## app/services/user_service.py
from typing import Dict, Any, List, Optional
from fastapi import HTTPException

# Nếu bạn dùng mock places trong service:
PLACES_STORE: List[Dict[str, Any]] = []

def list_hobby_tags() -> List[str]:
    return ["#an_chinh", "#an_vat", "#cafe", "#van_hoa", "#yen_tinh", "#soi_dong", "#song_ao"]

def list_duration_tags() -> List[Dict[str, str]]:
    return [
        {"display_name": "Dưới 1 tiếng", "tag_id": "#choc_lat"},
        {"display_name": "2-3 tiếng",    "tag_id": "#vai_tieng"},
        {"display_name": "Nửa ngày",     "tag_id": "#nua_ngay"},
    ]

def _dedup_keep_order(items: List[str]) -> List[str]:
    seen, out = set(), []
    for x in items:
        if x not in seen:
            seen.add(x)
            out.append(x)
    return out

def _validate_hobbies(hobbies: List[str]) -> None:
    valid = set(list_hobby_tags())
    bad = [h for h in hobbies if h not in valid]
    if bad:
        raise HTTPException(status_code=400, detail=f"Tag không hợp lệ: {', '.join(bad)}")

def _ensure_place_exists(place_id: int, places_source: List[Dict[str, Any]]) -> None:
    if not any(p.get("id") == place_id for p in places_source):
        raise HTTPException(status_code=404, detail="Địa điểm không tồn tại.")

# ---- Profile ----
def get_profile(user: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": user["id"],
        "email": user["email"],
        "full_name": user["full_name"],
        "hobbies": user.get("hobbies", []),
    }

def update_name(user: Dict[str, Any], full_name: str) -> Dict[str, Any]:
    name = (full_name or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="full_name không được rỗng.")
    user["full_name"] = name
    return get_profile(user)

# ---- Hobbies ----
def update_hobbies(user: Dict[str, Any], hobbies: List[str]) -> List[str]:
    clean = _dedup_keep_order(hobbies or [])
    _validate_hobbies(clean)
    user["hobbies"] = clean
    return clean

# ---- Favorites ----
def list_favorites(user: Dict[str, Any], places_source: Optional[List[Dict[str, Any]]] = None) -> List[Dict[str, Any]]:
    source = places_source if places_source is not None else PLACES_STORE
    fav_ids = set(user.get("favorites", []))
    return [p for p in source if p.get("id") in fav_ids]

def toggle_favorite(user: Dict[str, Any], place_id: int, places_source: Optional[List[Dict[str, Any]]] = None) -> Dict[str, str]:
    source = places_source if places_source is not None else PLACES_STORE
    _ensure_place_exists(place_id, source)
    favorites: List[int] = user.setdefault("favorites", [])
    if place_id in favorites:
        favorites.remove(place_id)
        return {"message": "Đã bỏ lưu"}
    else:
        favorites.append(place_id)
        return {"message": "Đã lưu vào yêu thích"}
