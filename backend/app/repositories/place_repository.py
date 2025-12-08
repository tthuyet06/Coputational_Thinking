# backend/app/repositories/place_repository.py
from __future__ import annotations

from typing import List, Optional, Tuple

from sqlalchemy.orm import Session

from backend.app.db import models
from backend.app.domain.place import Place as DomainPlace

from backend.app.domain.object_value import OpeningRange, SpecialOpeningRuleDomain
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
            for token in place.tags.split(", "):
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
            summarization=place.summarization,
            image=place.image,
            tags=tags,
            rating=place.rating,
            # open=place.open,
            # close=close,
        )

    def get_all_as_domain(self, db: Session) -> List[DomainPlace]:
        return [self.to_domain(p) for p in self.get_all(db)]

    # ------------------------------
    # Lấy Place + toàn bộ giờ mở cửa
    # ------------------------------
    def get_place_with_schedule(
       self, place_id: int, db: Session
   ) -> Tuple[DomainPlace, List[OpeningRange], List[SpecialOpeningRuleDomain]]:

        orm_place = (
            db.query(models.Place)
            .filter(models.Place.id == place_id)
            .one_or_none()
        )
        if orm_place is None:
            raise ValueError(f"Place id={place_id} không tồn tại")

        # Lấy giờ mở cửa theo thứ trong tuần
        orm_openings: List[models.OpeningHour] = (
            db.query(models.OpeningHour)
            .filter(models.OpeningHour.place_id == place_id)
            .all()
        )

        weekly_ranges: List[OpeningRange] = [
            OpeningRange(
                day_of_week=o.day_of_week,
                open_time=o.open_time,
                close_time=o.close_time,
            )
            for o in orm_openings
        ]

        # Lấy rule mở cửa đặc biệt (ngày lễ, event...)
        orm_rules: List[models.SpecialOpeningRule] = (
            db.query(models.SpecialOpeningRule)
            .filter(models.SpecialOpeningRule.place_id == place_id)
            .all()
        )

        special_rules: List[SpecialOpeningRuleDomain] = [
            SpecialOpeningRuleDomain(
                rule_type=r.rule_type,
                year=r.year,
                month=r.month,
                day=r.day,
                open_time=r.open_time,
                close_time=r.close_time,
                is_closed=bool(r.is_closed),
            )
            for r in orm_rules
        ]

        place = self.to_domain(orm_place)
        return place, weekly_ranges, special_rules