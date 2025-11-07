from typing import List

class Place:
    def __init__(self, id: int, name: str, address: str, image_url: str, description: str, tags: List[str]):
        self.id = id
        self.name = name
        self.address = address
        self.image_url = image_url
        self.description = description
        self.tags = tags

    def match_tags(self, user_tags: List[str]) -> bool:
        return any(tag in self.tags for tag in user_tags) # Kiểm tra nếu có ít nhất một tag trùng