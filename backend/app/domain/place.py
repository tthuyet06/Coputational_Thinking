from __future__ import annotations

from dataclasses import dataclass, field
from typing import List


@dataclass
class Place:
    """
    Thực thể Place ở tầng domain.

    Tối thiểu bám sát bảng places
    """
    id: int
    name: str
    address: str | None = None
    link_address: str | None = None
    lat: float | None = None
    lon: float | None = None
    overview: str | None = None
    image: str | None = None
    summarization: str | None = None
    tags: List[str] = field(default_factory=list)
    rating: float | None = None
    # open: float | None = None
    # close: float | None = None

    def has_tag(self, tag: str) -> bool:
        """
        Place có chứa tag này không (so sánh lowercase).
        """
        t = tag.strip().lower()
        return any(x.strip().lower() == t for x in self.tags)

    def match_any_tags(self, tags: List[str]) -> bool:
        """
        Trả về True nếu place có ít nhất 1 tag trùng với list tags cho trước.
        Dùng để match với hobbies của user, hoặc các filter khác.
        """
        tag_set = {t.strip().lower() for t in tags if t.strip()}
        if not tag_set:
            # Không filter theo tag => coi như match
            return True
        return any(p.strip().lower() in tag_set for p in self.tags)
