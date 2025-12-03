# backend/app/api/v1/endpoints/favorites.py (Phiên bản đã sửa)

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from backend.app.core import dependencies as deps
from backend.app.db.models import User
from backend.app.schemas.schemas import Place as PlaceSchema

from backend.app.services.user_service import (
    list_favorites,
    add_favorite_item,
    remove_favorite_item
)

router = APIRouter(
    prefix="/favorites",
    tags=["favorites"]
)


# --- API THÊM YÊU THÍCH---
@router.post("/{place_id}", status_code=status.HTTP_201_CREATED) # Nên dùng 201 Created
def add_favorite(
        place_id: int,
        db: Session = Depends(deps.get_db),
        current_user: User = Depends(deps.get_current_user)
) -> Dict[str, str]:
    """
    Thêm địa điểm vào danh sách yêu thích.
    """
    # Dùng service mới
    return add_favorite_item(db, current_user, place_id)


# --- API XÓA YÊU THÍCH---
@router.delete("/{place_id}", status_code=status.HTTP_200_OK) # Dùng 204 No Content hoặc 200 OK
def remove_favorite(
        place_id: int,
        db: Session = Depends(deps.get_db),
        current_user: User = Depends(deps.get_current_user)
) -> Dict[str, str]:
    """
    Bỏ địa điểm khỏi danh sách yêu thích.
    """
    # Dùng service mới
    return remove_favorite_item(db, current_user, place_id)


# --- API XEM DANH SÁCH---
@router.get("/", response_model=List[PlaceSchema])
def read_favorites(
        db: Session = Depends(deps.get_db),
        current_user: User = Depends(deps.get_current_user)
) -> List[Dict[str, Any]]:
    """
    Lấy danh sách địa điểm yêu thích của user.
    """
    return list_favorites(db, current_user)