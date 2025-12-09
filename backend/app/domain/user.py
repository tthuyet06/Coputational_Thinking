from __future__ import annotations

from dataclasses import dataclass, field
from typing import List
from uuid import UUID
from backend.app.domain.history import History
from backend.app.db import models
from sqlalchemy.orm import Session

@dataclass
class User:
    id: UUID
    email: str
    username: str
    hobbies: List[str] = field(default_factory=list)
    history: List[History] | None = None

    def set_hobbies(self, new_hobbies: List[str]) -> None:
        seen = set()
        cleaned: list[str] = []
        for h in new_hobbies:
            h_norm = h.strip()
            if not h_norm or h_norm in seen:
                continue
            seen.add(h_norm)
            cleaned.append(h_norm)
        self.hobbies = cleaned

    def has_hobby(self, tag: str) -> bool:
        """
        Kiểm tra user có sở thích với tag này không
        (so sánh dạng lowercase, bỏ khoảng trắng).
        """
        t = tag.strip().lower()
        return any(h.strip().lower() == t for h in self.hobbies)


    def update_history(self, place_id: int):
        for h in self.history:
            if h.place_id == place_id:
                h.update_rec_counter()
                return

        # nếu chưa tồn tại place_id thì thêm vào với reco_count: 0->7
        self.history.append(History(place_id=place_id,reco_count=7))


    def get_reco_count_by_place_id(self, place_id: int) -> int:
        for h in self.history:
            if h.place_id == place_id:
                return h.reco_count

        return 0

    # def save(self, db: Session, domain_user: User) -> User:
        """
        Lưu User và tự động đồng bộ History.
        """
        # 1. Lấy User ORM hiện tại từ DB (bao gồm cả history)
        user_orm = db.query(models.User).get(domain_user.id)

        if not user_orm:
            # Trường hợp tạo mới User (ít khi xảy ra logic này với history, nhưng cứ handle)
            user_orm = models.User(
                id=domain_user.id,
                email=domain_user.email,
                username=domain_user.username,
                hobbies=",".join(domain_user.hobbies)
            )
            db.add(user_orm)

        # 2. Update thông tin cơ bản
        user_orm.username = domain_user.username
        user_orm.hobbies = ",".join(domain_user.hobbies)

        # 3. LOGIC MERGE HISTORY (Quan trọng nhất)
        if domain_user.history is not None:
            # Tạo map để tra cứu nhanh: {place_id: DomainHistoryItem}
            domain_hist_map = {item.place_id: item for item in domain_user.history}

            # A. Cập nhật những cái ĐÃ CÓ trong DB
            # Duyệt qua list history hiện có của ORM
            for orm_item in user_orm.history_items:
                if orm_item.place_id in domain_hist_map:
                    # Nếu tồn tại cả 2 bên -> Update số liệu mới nhất từ Domain vào ORM
                    domain_item = domain_hist_map[orm_item.place_id]
                    orm_item.reco_count = domain_item.reco_count
                    orm_item.date = domain_item.time

                    # Xóa khỏi map để đánh dấu là "đã xử lý"
                    del domain_hist_map[orm_item.place_id]

            # B. Thêm những cái MỚI (những cái còn sót lại trong map)
            for new_domain_item in domain_hist_map.values():
                new_orm_item = models.History(
                    place_id=new_domain_item.place_id,
                    reco_count=new_domain_item.reco_count,
                    date=new_domain_item.time
                    # Không cần set user_id thủ công, SQLAlchemy tự làm
                )
                user_orm.history_items.append(new_orm_item)

        # 4. Commit xuống DB
        db.commit()
        db.refresh(user_orm)

        # 5. Trả về domain mới nhất
        return self.to_domain(user_orm)