from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, UniqueConstraint, func, Text
from sqlalchemy.orm import relationship
from backend.app.db.db_connection import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    username = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, server_default=func.current_timestamp())
    hobbies = Column(Text, nullable=True)
    favorites = relationship("Favorite", back_populates="user", cascade="all, delete-orphan")

class Place(Base):
    __tablename__ = "places"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    address = Column(String)
    lat = Column(Float)
    lon = Column(Float)
    rating = Column(Float)
    favorites = relationship("Favorite", back_populates="place", cascade="all, delete-orphan")

class Favorite(Base):
    __tablename__ = "favorites"

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    place_id = Column(Integer, ForeignKey("places.id", ondelete="CASCADE"), primary_key=True)
    added_at = Column(DateTime, server_default=func.current_timestamp())

    user = relationship("User", back_populates="favorites")
    place = relationship("Place", back_populates="favorites")

    __table_args__ = (UniqueConstraint("user_id", "place_id", name="uq_user_place"),)
