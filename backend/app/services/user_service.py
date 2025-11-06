from typing import List, Optional, Dict, Any
from fastapi import HTTPException

from backend.app.db.mock_db import MOCK_PLACES_DB

# ============================================================
# KHO TAG SỞ THÍCH & TAG THỜI LƯỢNG (Giữ nguyên)
# ============================================================
def list_hobby_tags() -> List[str]:
    """Trả về toàn bộ tag sở thích hợp lệ (để validate input / render UI)."""
    return ["#an_chinh", "#an_vat", "#cafe", "#van_hoa", "#yen_tinh", "#soi_dong", "#song_ao"]


def list_duration_tags() -> List[Dict[str, str]]:
    """Trả về danh sách tag thời lượng (display_name + tag_id) cho trang chủ."""
    return [
        {"display_name": "Dưới 1 tiếng", "tag_id": "#choc_lat"},
        {"display_name": "2-3 tiếng", "tag_id": "#vai_tieng"},
        {"display_name": "Nửa ngày", "tag_id": "#nua_ngay"},
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


# ============================================================
# CÁC SERVICE (Logic chính)
# ============================================================
# Lưu ý: các hàm này nhận 'user' (từ dependency) làm tham số
# và tự động CẬP NHẬT TRỰC TIẾP object 'user' đó (vì nó là mutable dict).
# ============================================================

# ---- Profile ----
def get_profile(user: Dict[str, Any]) -> Dict[str, Any]:
    # 'user' này là user lấy từ dependency chung
    return {
        "id": user["id"],
        "email": user["email"],
        "username": user["username"],  # Đổi full_name thành username cho khớp
        "hobbies": user.get("hobbies", []),
    }


def update_name(user: Dict[str, Any], full_name: str) -> Dict[str, Any]:
    name = (full_name or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="full_name không được rỗng.")

    # Cập nhật trực tiếp vào object user (lấy từ DB chung)
    user["username"] = name
    return get_profile(user)


# ---- Hobbies ----
def update_hobbies(user: Dict[str, Any], hobbies: List[str]) -> List[str]:
    clean = _dedup_keep_order(hobbies or [])
    _validate_hobbies(clean)

    # Cập nhật trực tiếp
    user["hobbies"] = clean
    return clean


# ---- Favorites ----
def list_favorites(user: Dict[str, Any]) -> List[Dict[str, Any]]:
    # Dùng MOCK_PLACES_DB làm nguồn
    source = MOCK_PLACES_DB
    fav_ids = set(user.get("favorites", []))
    return [p for p in source if p.get("id") in fav_ids]


def toggle_favorite(user: Dict[str, Any], place_id: int) -> Dict[str, str]:
    # Dùng MOCK_PLACES_DB làm nguồn
    source = MOCK_PLACES_DB
    _ensure_place_exists(place_id, source)

    # setdefault đảm bảo 'favorites' tồn tại
    favorites: List[int] = user.setdefault("favorites", [])

    if place_id in favorites:
        favorites.remove(place_id)
        return {"message": "Đã bỏ lưu"}
    else:
        favorites.append(place_id)
        return {"message": "Đã lưu vào yêu thích"}