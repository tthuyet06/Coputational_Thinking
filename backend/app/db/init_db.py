from backend.app.db.db_connection import engine, Base
# import models để Base “biết” các bảng
from backend.app.db import models  # noqa: F401

def create_all():
    Base.metadata.create_all(bind=engine)

# if __name__ == "__main__":
#     create_all()
#     print("✅ Tables created")
