# backend/app/repositories/hobby_repository.py
from __future__ import annotations

from typing import List, Optional

from sqlalchemy.orm import Session

from backend.app.db import models
from backend.app.domain.tag import Tag as DomainTag


#Loi dat ten lop
class TagRepositoryImpl:

    def get_all(self, db: Session) -> List[DomainTag]:
        rows = db.query(models.Tag).all()
        return [self._to_domain(row) for row in rows]

    def get_by_code(self, db: Session, code: str) -> Optional[DomainTag]:
        row = db.query(models.Tag).filter(models.Tag.code == code).first()
        return self._to_domain(row) if row else None

    @staticmethod
    def _to_domain(row: models.Tag) -> DomainTag:
        return DomainTag(
            id=row.code,
            display_name=row.name,
            group=row.type,
        )
    def get_duration_tags(self, db: Session) -> List[DomainTag]:
        rows = (
            db.query(models.Tag)
            .filter(models.Tag.type == "duration")
            .all()
        )
        return [self._to_domain(row) for row in rows]

    def get_hobby_tags(self, db: Session) -> List[DomainTag]:
        # Query toàn bộ hobby trong DB
        hobbies = db.query(models.Hobby).all()

        # Nếu có dữ liệu → map sang DomainTag
        if hobbies:
            return [
                DomainTag(
                    id=h.code,  # code là unique key của hobby
                    display_name=h.name,
                    group="hobby",
                )
                for h in hobbies
            ]

        # Nếu không có hobby nào → trả về list rỗng
        return []
    def get_activity_tags(self, db: Session) -> List[DomainTag]:
        # Query toàn bộ hobby trong DB
        activities = db.query(models.Activity).all()

        # Nếu có dữ liệu → map sang DomainTag
        if activities:
            return [
                DomainTag(
                    id=a.code,  # code là unique key của hobby
                    display_name=a.name,
                    group="activity",
                )
                for a in activities
            ]

        # Nếu không có activity nào → trả về list rỗng
        return []
