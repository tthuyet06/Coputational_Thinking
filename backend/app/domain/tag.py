# backend/app/domain/tag.py
from __future__ import annotations

from dataclasses import dataclass
from typing import List
from abc import ABC, abstractmethod


@dataclass(frozen=True)
class Tag:
    """
       Tag chung: dùng cho sở thích, thời lượng, vibe...

       - id: mã nội bộ (ví dụ "#cafe", "short")
       - display_name: tên hiển thị cho user
       - group: nhóm (hobby, duration, vibe, time_of_day...)
       """
    id: str
    display_name: str
    group: str | None = None


class TagRepository(ABC):
    """
    Interface để tầng infra (DB / CSV / config) implement.

    Domain chỉ nói: "Tôi cần danh sách hobby tag, duration tag".
    Còn lấy từ đâu là việc của repository concrete.
    """

    @abstractmethod
    def get_hobby_tags(self) -> List[Tag]:
        raise NotImplementedError

    @abstractmethod
    def get_duration_tags(self) -> List[Tag]:
        raise NotImplementedError
