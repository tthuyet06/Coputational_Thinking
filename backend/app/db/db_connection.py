# backend/app/db/db_connection.py

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from os import getenv

# Thư mục gốc backend
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))

# Folder data nằm trong backend/data/
DATA_DIR = os.path.join(BASE_DIR, "data")

# Tạo thư mục nếu chưa tồn tại
os.makedirs(DATA_DIR, exist_ok=True)

# File database cố định
DB_FILE = os.path.join(DATA_DIR, "project.db")

# Nếu không có DATABASE_URL trong .env -> mặc định dùng SQLite
DATABASE_URL = getenv("DATABASE_URL", f"sqlite:///{DB_FILE}")

# Nếu dùng SQLite -> cần connect_args
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        echo=False,
    )
else:
    engine = create_engine(DATABASE_URL, echo=False)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
