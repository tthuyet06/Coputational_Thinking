# backend/app/repositories/user_repository.py
from __future__ import annotations

from typing import Optional, List
from uuid import UUID

from sqlalchemy.orm import Session

from backend.app.db import models
from backend.app.domain.user import User as DomainUser


class UserRepository:
    """
    Repository làm việc với bảng users.
    - Cung cấp CRUD ở mức ORM
    - Map ORM <-> domain.User
    """

    # ========== ORM level (trả về models.User) ==========

    def get_by_id(self, db: Session, user_id: UUID) -> Optional[models.User]:
        return db.query(models.User).filter(models.User.id == user_id).first()

    def get_by_email(self, db: Session, email: str) -> Optional[models.User]:
        return db.query(models.User).filter(models.User.email == email).first()

    def save(self, db: Session, user: models.User) -> models.User:
        """Lưu user (insert/update) và refresh lại từ DB."""
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    # ========== Mapping sang domain ==========

    def to_domain(self, user: models.User) -> DomainUser:
        """
        Chuyển từ models.User -> domain.User.

        - Parse cột hobbies: Text -> List[str]
        """
        raw = user.hobbies or ""
        hobbies: List[str] = []
        for token in raw.split(","):
            tagged = token.strip()
            if tagged:
                hobbies.append(tagged)

        return DomainUser(
            id=user.id,
            email=user.email,
            username=user.username,
            hobbies=hobbies,
        )

    def update_hobbies(
        self,
        db: Session,
        user: models.User,
        hobbies: List[str],
    ) -> models.User:
        """
        Cập nhật cột hobbies trong DB từ list string đã chuẩn hoá.
        """
        user.hobbies = ",".join(hobbies) if hobbies else None
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    def update_username(
        self,
        db: Session,
        user: models.User,
        username: str,
    ) -> models.User:
        user.username = username
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
