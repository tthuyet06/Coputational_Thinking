from typing import List
from .place import Place
from .user import User


from dataclasses import dataclass
from uuid import UUID


@dataclass(frozen=True)
class Favorite:
    """
    Mapping giữa user và địa điểm mà user đã lưu yêu thích.
    """
    user_id: UUID
    place_id: int
# class FavoriteManager:
#     def __init__(self, favorite_repo):
#         self.favorite_repo = favorite_repo
#
#     def toggle_favorite(self, user: User, place_id: int) -> str:
#         """Thêm hoặc bỏ yêu thích."""
#         if self.favorite_repo.is_favorite(user.id, place_id):
#             self.favorite_repo.remove_favorite(user.id, place_id)
#             return "Đã bỏ lưu"
#         else:
#             self.favorite_repo.add_favorite(user.id, place_id)
#             return "Đã lưu vào yêu thích"
#
#     def list_favorites(self, user: User) -> List[Place]:
#         """Trả về danh sách địa điểm yêu thích của user."""
#         return self.favorite_repo.get_favorites(user.id) # core