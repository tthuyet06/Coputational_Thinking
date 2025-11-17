# backend/app/domain/hobby.py
from dataclasses import dataclass


@dataclass
class Hobby:
    """
    Tương ứng 1 dòng trong bảng hobbies.
    - code: như "#cafe", "#an_chinh"
    - label_en: tên hiển thị (có thể sau này thêm label_vi, icon...)
    """
    id: int
    code: str
    label_en: str
