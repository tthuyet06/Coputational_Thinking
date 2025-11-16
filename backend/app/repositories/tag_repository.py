# backend/app/repositories/tag_repository.py
from __future__ import annotations

from typing import List

from sqlalchemy.orm import Session

from backend.app.db import models
from backend.app.domain.tag import Tag, TagRepository


class TagRepositoryImpl(TagRepository):
    """
    Implement thực tế cho TagRepository.
    - Hobby tags: đọc từ bảng hobbies (nếu có)
    - Duration tags: list cứng
    """

    def __init__(self, db: Session):
        self._db = db

    # ========== Hobby tags ==========

    def get_hobby_tags(self) -> List[Tag]:
        hobbies = self._db.query(models.Hobby).all()
        if hobbies:
            return [
                Tag(
                    id=h.code,
                    display_name=h.label_en,
                    group="hobby",
                )
                for h in hobbies
            ]

        # Fallback nếu bảng Hobby trống / chưa seed
        return [
            Tag(id="#an_chinh", display_name="Ăn chính", group="hobby"),
            Tag(id="#an_vat", display_name="Ăn vặt", group="hobby"),
            Tag(id="#cafe", display_name="Cà phê", group="hobby"),
            Tag(id="#van_hoa", display_name="Văn hoá", group="hobby"),
            Tag(id="#yen_tinh", display_name="Yên tĩnh", group="hobby"),
            Tag(id="#soi_dong", display_name="Sôi động", group="hobby"),
            Tag(id="#song_ao", display_name="Sống ảo", group="hobby"),
        ]

    # ========== Duration tags ==========

    def get_duration_tags(self) -> List[Tag]:
        # Hiện tại chưa có bảng duration trong DB, nên dùng list cứng.
        return [
            Tag(id="short", display_name="Dưới 2 giờ", group="duration"),
            Tag(id="medium", display_name="2–4 giờ", group="duration"),
            Tag(id="long", display_name="Trên 4 giờ", group="duration"),
        ]
