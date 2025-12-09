# backend/app/repositories/user_repository.py
from __future__ import annotations

from typing import Optional, List
from uuid import UUID

from sqlalchemy.orm import Session, joinedload

from backend.app.db import models
from backend.app.domain.user import User as DomainUser
from backend.app.domain.history import History

class UserRepository:
    """
    Repository làm việc với bảng users.
    - Cung cấp CRUD ở mức ORM
    - Map ORM <-> domain.User
    """

    # ========== ORM level (trả về models.User) ==========

    def get_by_id(self, db: Session, user_id: UUID) -> Optional[models.User]:
        return (
            db.query(models.User)
            .options(joinedload(models.User.history_items))
            .filter(models.User.id == user_id)
            .first()
        )

    def get_by_email(self, db: Session, email: str) -> Optional[models.User]:
        return db.query(models.User).filter(models.User.email == email).first()

    def save(self, db: Session, domain_user: DomainUser) -> DomainUser:
        """
        Lưu User + Tự động đồng bộ History từ Domain xuống DB
        """
        # 1. Lấy User ORM (để update)
        user_orm = self.get_by_id(db, domain_user.id)

        if not user_orm:
            # Tạo mới nếu chưa có
            user_orm = models.User(
                id=domain_user.id,
                email=domain_user.email,
                username=domain_user.username,
                hobbies=",".join(domain_user.hobbies)
                # history sẽ được add ở bước dưới
            )
            db.add(user_orm)
        else:
            # Update thông tin cơ bản
            user_orm.username = domain_user.username
            user_orm.hobbies = ",".join(domain_user.hobbies)

        # 2. ĐỒNG BỘ HISTORY (MERGE LOGIC)
        # Nếu domain_user.history có dữ liệu
        if domain_user.history is not None:
            # Tạo map: {place_id : DomainHistoryItem} để dễ tra cứu
            domain_hist_map = {h.place_id: h for h in domain_user.history}

            # A. Update những cái đã có trong DB
            # Duyệt qua list hiện tại trong DB
            for orm_item in user_orm.history_items:
                if orm_item.place_id in domain_hist_map:
                    # Có ở cả 2 bên -> Update số liệu
                    d_item = domain_hist_map[orm_item.place_id]
                    orm_item.reco_count = d_item.reco_count
                    orm_item.date = d_item.time

                    # Xóa khỏi map để đánh dấu là "xong"
                    del domain_hist_map[orm_item.place_id]

            # B. Insert những cái mới (còn sót lại trong map)
            for d_item in domain_hist_map.values():
                new_orm = models.History(
                    place_id=d_item.place_id,
                    reco_count=d_item.reco_count,
                    date=d_item.time
                    # user_id tự động được điền bởi SQLAlchemy
                )
                user_orm.history_items.append(new_orm)

        # 3. Commit
        db.commit()
        db.refresh(user_orm)

        # 4. Trả về Domain User mới nhất
        return self.to_domain(user_orm)

    # ========== Mapping sang domain ==========

    def to_domain(self, user: models.User) -> DomainUser:
        # 1. Parse hobbies (như cũ)
        raw = user.hobbies or ""
        hobbies: List[str] = [t.strip() for t in raw.split(",") if t.strip()]

        # 2. Parse History (Mới thêm)
        # Lưu ý: user.history_items là list ORM, cần chuyển sang list Domain
        domain_history: List[History] = []
        if user.history_items:
            for item in user.history_items:
                domain_history.append(
                    History(
                        place_id=item.place_id,
                        reco_count=item.reco_count,
                        time=item.date  # date trong DB -> time trong Domain
                    )
                )

        return DomainUser(
            id=user.id,
            email=user.email,
            username=user.username,
            hobbies=hobbies,
            history=domain_history
        )

    def update_hobbies(
        self,
        db: Session,
        user: models.User,
        hobbies: List[str],
    ) -> models.User:
        """
        Cập nhật cột hobbies trong DB từ list string đã chuẩn hoá.
        """
        user.hobbies = ",".join(hobbies) if hobbies else None
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    def update_username(
        self,
        db: Session,
        user: models.User,
        username: str,
    ) -> models.User:
        user.username = username
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
