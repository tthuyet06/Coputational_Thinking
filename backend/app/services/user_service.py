from typing import List, Optional, Dict, Any
from fastapi import HTTPException
from sqlalchemy.orm import Session
from backend.app.db import models
from backend.app.utils.tag_parser import normalize_hobby_tags

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

def _validate_hobbies(hobbies: List[str]) -> None:
    valid = set(list_hobby_tags())
    bad = [h for h in hobbies if h not in valid]
    if bad:
        raise HTTPException(status_code=400, detail=f"Invalid tag(s): {', '.join(bad)}")


def _ensure_place_exists(db: Session, place_id: int) -> models.Place:
    place = db.query(models.Place).filter(models.Place.id == place_id).first()
    if not place:
        raise HTTPException(status_code=404, detail="Place does not exist.")
    return place


# ============================================================
# CÁC SERVICE (Logic chính)
# ============================================================
# Lưu ý: các hàm này nhận 'user' (từ dependency) làm tham số
# và tự động CẬP NHẬT TRỰC TIẾP object 'user' đó (vì nó là mutable dict).
# ============================================================

# ---- Profile ----
def get_profile(user: models.User) -> Dict[str, Any]:
    # 'user' này là từ dependency get_current_user

    # ✅ Chuyển đổi hobbies từ Text (chuỗi) sang list
    hobbies_list = user.hobbies.split(',') if user.hobbies else []

    return {
        "id": user.id,
        "email": user.email,
        "username": user.username,
        "hobbies": hobbies_list,
    }


# def update_name(db: Session, user: models.User, full_name: str) -> models.User: # << THAY ĐỔI
#     name = (full_name or "").strip()
#     if not name:
#         raise HTTPException(status_code=400, detail="username cannot be empty.")
#
#     # ✅ Cập nhật object SQLAlchemy và commit
#     user.username = name
#     db.commit()
#     db.refresh(user)
#     return user


# ---- Hobbies ----
def update_hobbies(db: Session, user: models.User, hobbies: List[str]) -> List[str]:
    # SỬ DỤNG HELPER MỚI
    clean = normalize_hobby_tags(hobbies)

    # VALIDATE DỮ LIỆU ĐÃ ĐƯỢC CHUẨN HÓA
    _validate_hobbies(clean)

    # CẬP NHẬT VÀO DB
    # Lưu hobbies dưới dạng chuỗi ngăn cách bởi dấu phẩy
    user.hobbies = ",".join(clean)
    db.commit()
    return clean


# ---- Favorites ----
def list_favorites(user: models.User) -> List[models.Place]: # << THAY ĐỔI
    # ✅ Dùng relationship "favorites" của User
    # user.favorites là list các object Favorite
    # fav.place là object Place tương ứng
    return [fav.place for fav in user.favorites]


def toggle_favorite(db: Session, user: models.User, place_id: int) -> Dict[str, str]:  # << THAY ĐỔI

    # ✅ Kiểm tra địa điểm tồn tại bằng DB
    place = _ensure_place_exists(db, place_id)

    # ✅ Kiểm tra favorite tồn tại bằng DB
    existing_fav = db.query(models.Favorite).filter(
        models.Favorite.user_id == user.id,
        models.Favorite.place_id == place.id
    ).first()

    if existing_fav:
        # ✅ Xóa
        db.delete(existing_fav)
        db.commit()
        return {"message": "Removed from favorites"}
    else:
        # ✅ Thêm
        new_fav = models.Favorite(user_id=user.id, place_id=place.id)
        db.add(new_fav)
        db.commit()
        return {"message": "Saved to favorites"}