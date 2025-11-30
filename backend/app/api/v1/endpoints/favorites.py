# backend/app/api/v1/endpoints/favorites.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from backend.app.core import dependencies as deps
from backend.app.db.models import User, Place, Favorite  # <--- Import Favorite
from backend.app.schemas.schemas import Place as PlaceSchema

router = APIRouter(
    prefix="/favorites",
    tags=["favorites"]
)


# --- API THÊM ---
@router.post("/{place_id}", status_code=status.HTTP_201_CREATED)
def add_favorite(
        place_id: int,
        db: Session = Depends(deps.get_db),
        current_user: User = Depends(deps.get_current_user)
):
    # 1. Kiểm tra Place tồn tại
    place = db.query(Place).filter(Place.id == place_id).first()
    if not place:
        raise HTTPException(status_code=404, detail="Location not found")

    # 2. Kiểm tra đã like chưa (Query bảng Favorite)
    existing_fav = db.query(Favorite).filter(
        Favorite.user_id == current_user.id,
        Favorite.place_id == place_id
    ).first()

    if existing_fav:
        raise HTTPException(status_code=400, detail="You have liked this place")

    # 3. Tạo object Favorite mới (Khác biệt so với cách cũ ở đây)
    new_fav = Favorite(user_id=current_user.id, place_id=place_id)
    db.add(new_fav)
    db.commit()

    return {"message": "Added to favorites"}


# --- API XÓA ---
@router.delete("/{place_id}", status_code=status.HTTP_200_OK)
def remove_favorite(
        place_id: int,
        db: Session = Depends(deps.get_db),
        current_user: User = Depends(deps.get_current_user)
):
    # Tìm đúng cái dòng Favorite đó để xóa
    fav_to_delete = db.query(Favorite).filter(
        Favorite.user_id == current_user.id,
        Favorite.place_id == place_id
    ).first()

    if fav_to_delete:
        db.delete(fav_to_delete)
        db.commit()

    return {"message": "Removed from favorites"}


# --- API XEM DANH SÁCH ---
@router.get("/", response_model=List[PlaceSchema])
def read_favorites(
        current_user: User = Depends(deps.get_current_user)
):
    # current_user.favorites bây giờ là danh sách các object Favorite (chứa timestamp...)
    # Nhưng Frontend chỉ cần danh sách Place, nên ta dùng vòng lặp để lôi Place ra
    return [fav.place for fav in current_user.favorites]