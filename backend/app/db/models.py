# backend/app/db/models.py

from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Float,
    DateTime,
    ForeignKey,
    UniqueConstraint,
    Boolean,
    func,
)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import relationship
import uuid

from backend.app.db.db_connection import Base


# ============================================================
# USER
# ============================================================
class User(Base):
    __tablename__ = "users"

    id = Column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        unique=True,
        nullable=False,
    )

    email = Column(String, nullable=False, unique=True, index=True)
    username = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)

    # Lưu danh sách tag hobbies dạng chuỗi: "#cafe,#an_vat"
    hobbies = Column(Text, nullable=True)

    created_at = Column(DateTime, server_default=func.current_timestamp())

    # Quan hệ
    favorites = relationship(
        "Favorite",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    # ✅ THÊM QUAN HỆ NÀY ĐỂ KHỚP VỚI RefreshToken
    refresh_tokens = relationship(
        "RefreshToken",
        back_populates="user",
        cascade="all, delete-orphan",
    )
class Tag(Base):
    __tablename__ = "tags"

    code = Column(String, primary_key=True, nullable=True)

    name = Column(String, nullable=False)

    type = Column(String, nullable=True)

# ============================================================
# PLACE
# ============================================================
class Place(Base):
    __tablename__ = "places"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String, nullable=False)

    address = Column(String, nullable=True)
    link_address = Column(String, nullable=True)

    lat = Column(Float, nullable=True)
    lon = Column(Float, nullable=True)

    overview = Column(Text, nullable=True)
    image = Column(String, nullable=True)
    summarization = Column(Text, nullable=True)
    # tags được lưu dạng: "cafe,an_vat,van_hoa"
    tags = Column(Text, nullable=True)
    rating = Column(Float, nullable=True)

    open = Column(Text, nullable=True)
    close = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.current_timestamp())


# ============================================================
# HOBBY (tag sở thích lưu trong DB – optional)
# ============================================================
class Hobby(Base):
    __tablename__ = "hobbies"

    id = Column(Integer, primary_key=True, autoincrement=True)

    # ví dụ: "#cafe" hoặc "#yen_tinh"
    code = Column(String, unique=True, index=True)

    # tên hiển thị
    name = Column(String, nullable=False)


class Activity(Base):
    """
    Bảng activities trong DB.

    Lưu danh sách loại hình địa điểm / hoạt động.
    Ví dụ:
    - code: 'cafe', name: 'Quán cafe'
    - code: 'food', name: 'Ăn uống'
    - code: 'milktea', name: 'Trà sữa'
    """
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)

# ============================================================
# FAVORITE (mapping N-N giữa User và Place)
# ============================================================
class Favorite(Base):
    __tablename__ = "favorites"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    place_id = Column(
        Integer,
        ForeignKey("places.id", ondelete="CASCADE"),
        nullable=False,
    )

    created_at = Column(DateTime, server_default=func.current_timestamp())

    # Quan hệ
    user = relationship("User", back_populates="favorites")
    place = relationship("Place")

    # Đảm bảo 1 user không save 1 place hai lần
    __table_args__ = (
        UniqueConstraint("user_id", "place_id", name="unique_favorite"),
    )


# ============================================================
# REFRESH TOKEN
# ============================================================
class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    token = Column(String, unique=True, index=True, nullable=False)

    created_at = Column(DateTime, server_default=func.current_timestamp())
    expires_at = Column(DateTime, nullable=False)

    # Đã bị thu hồi hay chưa
    revoked = Column(Boolean, default=False)

    # Quan hệ ngược về User (phải KHỚP với User.refresh_tokens)
    user = relationship("User", back_populates="refresh_tokens")
