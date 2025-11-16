# backend/app/repositories/hobby_repository.py
from __future__ import annotations

from typing import List, Optional

from sqlalchemy.orm import Session

from backend.app.db import models
from backend.app.domain.hobby import Hobby as DomainHobby


class HobbyRepository:
    """
    Repository cho bảng hobbies.
    """

    def get_all(self, db: Session) -> List[DomainHobby]:
        rows = db.query(models.Hobby).all()
        return [self._to_domain(row) for row in rows]

    def get_by_code(self, db: Session, code: str) -> Optional[DomainHobby]:
        row = db.query(models.Hobby).filter(models.Hobby.code == code).first()
        return self._to_domain(row) if row else None

    @staticmethod
    def _to_domain(row: models.Hobby) -> DomainHobby:
        return DomainHobby(
            id=row.id,
            code=row.code,
            label_en=row.label_en,
        )
