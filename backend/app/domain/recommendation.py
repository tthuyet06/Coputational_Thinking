# backend/app/domain/recommendation.py
from __future__ import annotations

from dataclasses import dataclass, field
from typing import List, Protocol

from backend.app.domain.place import Place
from backend.app.domain.user import User
from backend.app.domain.location import Location


@dataclass(frozen=True)
class RecommendationCriteria:
    """
    Điều kiện gợi ý:
    - location: vị trí hiện tại của user
    - duration_tag: thời lượng rảnh (short/medium/long...)
    - extra_tags: các tag filter thêm (ví dụ: "#cafe", "#yen_tinh"...)
    """
    location: Location
    duration_tag: str | None = None
    extra_tags: List[str] = field(default_factory=list)


@dataclass
class RecommendationResult:
    """
    Kết quả gợi ý: danh sách địa điểm.
    Sau này có thể thêm:
    - score
    - lý do gợi ý
    """
    places: List[Place]


class IRecommendationService(Protocol):
    """
    Interface chuẩn cho recommend engine ở tầng domain.

    Tầng service (recommend_engine.py) sẽ implement interface này,
    nhưng domain không cần biết chi tiết inside.
    """

    def recommend(
        self,
        user: User,
        criteria: RecommendationCriteria,
    ) -> RecommendationResult:
        ...
