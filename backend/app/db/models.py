import uuid
from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, func, Text
from sqlalchemy.orm import relationship
from sqlalchemy import UUID  # Import UUID
from backend.app.db.db_connection import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False, index=True)
    username = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, server_default=func.current_timestamp())
    hobbies = Column(Text, nullable=True)

    favorites = relationship("Favorite", back_populates="user", cascade="all, delete-orphan")
    refresh_tokens = relationship("RefreshToken", back_populates="user",
                                  cascade="all, delete-orphan")


class Place(Base):
    __tablename__ = "places"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    address = Column(String)
    lat = Column(Float)
    lon = Column(Float)
    rating = Column(Float)
    tags = Column(Text, nullable=True)

    favorites = relationship("Favorite", back_populates="place", cascade="all, delete-orphan")


class Favorite(Base):
    __tablename__ = "favorites"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)

    place_id = Column(Integer, ForeignKey("places.id", ondelete="CASCADE"), primary_key=True)

    added_at = Column(DateTime, server_default=func.current_timestamp())

    user = relationship("User", back_populates="favorites")
    place = relationship("Place", back_populates="favorites")


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    token = Column(String, primary_key=True)  # Dùng token làm khóa chính

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True)

    created_at = Column(DateTime, server_default=func.current_timestamp())
    expired_at = Column(DateTime)

    user = relationship("User", back_populates="refresh_tokens")