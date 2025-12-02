# backend/app/repositories/place_repository.py
from __future__ import annotations

from typing import List, Optional

from sqlalchemy.orm import Session

from backend.app.db import models
from backend.app.domain.place import Place as DomainPlace


class PlaceRepository:
    """
    Repository cho bảng places.
    - Lấy dữ liệu ORM
    - Chuyển sang domain.Place để đưa vào recommend engine
    """

    # ========== ORM level ==========

    def get_by_id(self, db: Session, place_id: int) -> Optional[models.Place]:
        return db.query(models.Place).filter(models.Place.id == place_id).first()

    def get_all(self, db: Session) -> List[models.Place]:
        return db.query(models.Place).all()

    # ========== Mapping ORM -> domain ==========

    def to_domain(self, place: models.Place) -> DomainPlace:
        tags: list[str] = []
        if place.tags:
            for token in place.tags.split(" "):
                t = token.strip()
                if t:
                    tags.append(t)

        return DomainPlace(
            id=place.id,
            name=place.name,
            address=place.address,
            link_address=place.link_address,
            lat=place.lat,
            lon=place.lon,
            overview=place.overview,
            image=place.image,
            tags=tags,
            rating=rating,
            open=open,
            close=close,
        )

    def get_all_as_domain(self, db: Session) -> List[DomainPlace]:
        return [self.to_domain(p) for p in self.get_all(db)]
