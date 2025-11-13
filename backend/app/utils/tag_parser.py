from typing import List, Optional

def normalize_hobby_tags(tags: Optional[List[str]]) -> List[str]:
    """
    Chuẩn hóa một danh sách các tag sở thích:
    1. Nếu đầu vào là None, trả về danh sách rỗng.
    2. Loại bỏ các khoảng trắng thừa ở đầu/cuối mỗi tag.
    3. Loại bỏ các tag rỗng.
    4. Loại bỏ các tag trùng lặp, giữ nguyên thứ tự.
    5. Đảm bảo tất cả các tag đều bắt đầu bằng dấu "#".
    """
    if not tags:
        return []

    seen = set()
    normalized = []
    for tag in tags:
        stripped_tag = tag.strip()

        # Chuẩn hóa: Thêm dấu '#' nếu thiếu
        if stripped_tag and not stripped_tag.startswith("#"):
            stripped_tag = f"#{stripped_tag}"

        if stripped_tag and stripped_tag not in seen:
            seen.add(stripped_tag)
            normalized.append(stripped_tag)

    return normalized