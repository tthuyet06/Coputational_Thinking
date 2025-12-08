# backend/app/domain/hobby.py
from dataclasses import dataclass


@dataclass
class Hobby:
    """
    Tương ứng 1 dòng trong bảng hobbies.
    - id:
    - code: như "#cafe", "#an_chinh"
    - label_en: tên hiển thị (có thể sau này thêm label_vi, icon...)
    """
    id: int
    code: str  # code nội bộ, duy nhất: "cafe", "food", "milktea", ...
    name: str
