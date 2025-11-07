from typing import List


class Hobbies:
    def __init__(self, hobbies: List[str] = None):
        self.hobbies = hobbies or []

    def set_hobbies(self, new_hobbies: List[str]):
        self.hobbies = new_hobbies


class User:
    def __init__(self, id: int | None, email: str, full_name: str, password_hash: str, hobbies: Hobbies | None = None):
        self.id = id
        self.email = email
        self.full_name = full_name
        self.password = password_hash
        self.hobbies = hobbies or Hobbies()

    
    def update_name(self, new_name: str):
        self.full_name = new_name


    def set_hobbies(self, new_hobbies: Hobbies):
        self.hobbies = new_hobbies


    def check_password(self, plain_password: str, verify_password) -> bool:
        # Tạm thời mềnh bỏ qua phần mã hóa password, verify_password là hàm so sánh
        return plain_password == self.password_hash