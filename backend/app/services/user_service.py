# backend/app/services/user_service.py

from typing import List, Dict, Any
from fastapi import HTTPException
from sqlalchemy.orm import Session

from backend.app.db import models
from backend.app.utils.tag_parser import normalize_hobby_tags
from backend.app.repositories import (
    UserRepository,
    FavoriteRepository,
    PlaceRepository,
)

# Khởi tạo repository (stateless, dùng lại được)
user_repo = UserRepository()
fav_repo = FavoriteRepository()
place_repo = PlaceRepository()


# ============================================================
# KHO TAG SỞ THÍCH & TAG THỜI LƯỢNG
# (giữ hợp đồng API như cũ để không phá frontend)
# ============================================================
def list_hobby_tags() -> List[str]:
    """
    Trả về toàn bộ tag sở thích hợp lệ (để validate input / render UI).

    Lưu ý:
    - Đây là "kho chuẩn" của hệ thống.
    - update_hobbies() sẽ chỉ chấp nhận các tag nằm trong danh sách này.
    """
    return [
        "#an_chinh",
        "#an_vat",
        "#cafe",
        "#van_hoa",
        "#yen_tinh",
        "#soi_dong",
        "#song_ao",
    ]


def list_duration_tags() -> List[Dict[str, str]]:
    """
    Trả về danh sách tag thời lượng cho API:
    [
      {"display_name": "Dưới 2 giờ", "tag_id": "short"},
      {"display_name": "2–4 giờ", "tag_id": "medium"},
      {"display_name": "Trên 4 giờ", "tag_id": "long"},
    ]

    Endpoint /api/v1/tags/durations đang dùng format này.
    """
    return [
        {"display_name": "Dưới 2 giờ", "tag_id": "short"},
        {"display_name": "2–4 giờ", "tag_id": "medium"},
        {"display_name": "Trên 4 giờ", "tag_id": "long"},
    ]


# ============================================================
# PROFILE USER
# ============================================================
def get_profile(user: models.User) -> Dict[str, Any]:
    """
    Trả về thông tin user hiện tại theo format UserResponse:

    {
       "id": UUID,
       "email": str,
       "username": str,
       "hobbies": List[str]
    }

    Logic:
    - Dùng UserRepository.to_domain() để parse cột hobbies (Text -> List[str])
    - Không trả password_hash, token, v.v.
    """
    domain_user = user_repo.to_domain(user)

    return {
        "id": domain_user.id,
        "email": domain_user.email,
        "username": domain_user.username,
        "hobbies": domain_user.hobbies,
    }


def update_name(db: Session, user: models.User, username: str) -> models.User:
    """
    Cập nhật tên hiển thị (username) cho user.

    - Trim khoảng trắng
    - Không cho phép username rỗng
    """
    new_name = (username or "").strip()
    if not new_name:
        raise HTTPException(status_code=400, detail="Username cannot be empty.")

    updated = user_repo.update_username(db, user, new_name)
    return updated


# ============================================================
# SỞ THÍCH (HOBBIES) CỦA USER
# ============================================================
def update_hobbies(
    db: Session,
    user: models.User,
    hobbies: List[str] | None,
) -> List[str]:
    """
    Cập nhật danh sách sở thích cho user.

    Bước xử lý:
    1. Chuẩn hóa bằng normalize_hobby_tags():
        - None -> []
        - trim
        - loại rỗng
        - bỏ trùng, giữ thứ tự
        - tự thêm '#' nếu thiếu
    2. Validate: chỉ cho phép tag nằm trong list_hobby_tags().
    3. Lưu xuống DB qua UserRepository.update_hobbies().
    4. Trả về danh sách hobbies đã chuẩn hóa (để endpoint /users/me/hobbies trả ra).

    Endpoint `hobbies.py` đang:
        normalized = update_hobbies(...)
        return {"message": "...", "hobbies": normalized}
    nên hàm này phải trả về List[str].
    """
    # B1: Chuẩn hóa
    normalized = normalize_hobby_tags(hobbies)

    # B2: Validate với kho tag hợp lệ
    allowed = set(list_hobby_tags())
    invalid = [tag for tag in normalized if tag not in allowed]

    if invalid:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid hobby tags: {invalid}. Allowed: {sorted(allowed)}",
        )

    # B3: Lưu DB (cột Text `hobbies` trong bảng users)
    user_repo.update_hobbies(db, user, normalized)

    # B4: Trả về danh sách đã chuẩn hóa
    return normalized


# ============================================================
# FAVORITES (ĐỊA ĐIỂM YÊU THÍCH)
# ============================================================
def list_favorites(db: Session, user: models.User) -> List[Dict[str, Any]]:
    """
    Lấy danh sách địa điểm yêu thích của user hiện tại.

    Output: list các dict có format của schema Place:
    {
        "id": int,
        "name": str,
        "address": str,
        "image_url": str,
        "description": str,
        "tags": List[str],
    }

    - Dùng FavoriteRepository để lấy các favorite (user_id, place_id)
    - Dùng PlaceRepository để lấy thông tin chi tiết địa điểm + map sang domain.Place
    """
    favorites = fav_repo.list_by_user(db, user.id)

    results: List[Dict[str, Any]] = []

    for fav in favorites:
        orm_place = place_repo.get_by_id(db, fav.place_id)
        if not orm_place:
            # Nếu place bị xóa khỏi DB thì bỏ qua
            continue

        domain_place = place_repo.to_domain(orm_place)

        results.append(
            {
                "id": domain_place.id,
                "name": domain_place.name,
                "address": domain_place.address or "",
                "image_url": domain_place.image or "",
                "description": domain_place.overview or "",
                "tags": domain_place.tags,
            }
        )

    return results


def toggle_favorite(
    db: Session,
    user: models.User,
    place_id: int,
) -> Dict[str, str]:
    """
    Thêm / bỏ địa điểm khỏi danh sách yêu thích của user.

    - Nếu place không tồn tại -> 404
    - Nếu đã là favorite -> xóa & trả message "Removed from favorites"
    - Nếu chưa -> thêm & trả message "Saved to favorites"
    """
    place = place_repo.get_by_id(db, place_id)
    if not place:
        raise HTTPException(status_code=404, detail="Place not found.")

    if fav_repo.is_favorite(db, user.id, place_id):
        fav_repo.remove(db, user.id, place_id)
        return {"message": "Removed from favorites"}
    else:
        fav_repo.add(db, user.id, place_id)
        return {"message": "Saved to favorites"}
