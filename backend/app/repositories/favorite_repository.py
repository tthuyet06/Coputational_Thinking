# backend/app/repositories/favorite_repository.py
from __future__ import annotations

from typing import List
from uuid import UUID

from sqlalchemy.orm import Session

from backend.app.db import models
from backend.app.domain.favorite import Favorite as DomainFavorite

class FavoriteRepository:
    """
    Repository cho bảng favorites.
    """

    def is_favorite(self, db: Session, user_id: UUID, place_id: int) -> bool:
        return (
            db.query(models.Favorite)
            .filter(
                models.Favorite.user_id == user_id,
                models.Favorite.place_id == place_id,
            )
            .first()
            is not None
        )

    def add(self, db: Session, user_id: UUID, place_id: int) -> models.Favorite:
        fav = models.Favorite(user_id=user_id, place_id=place_id)
        db.add(fav)
        db.commit()
        db.refresh(fav)
        return fav

    def remove(self, db: Session, user_id: UUID, place_id: int) -> None:
        (
            db.query(models.Favorite)
            .filter(
                models.Favorite.user_id == user_id,
                models.Favorite.place_id == place_id,
            )
            .delete()
        )
        db.commit()

    def list_by_user(self, db: Session, user_id: UUID) -> List[DomainFavorite]:
        rows = (
            db.query(models.Favorite)
            .filter(models.Favorite.user_id == user_id)
            .all()
        )
        return [DomainFavorite(user_id=row.user_id, place_id=row.place_id) for row in rows]
