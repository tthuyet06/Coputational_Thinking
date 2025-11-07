from sqlalchemy.orm import Session
from backend.app.db.db_connection import SessionLocal
from backend.app.domain.models import User, Place
from backend.app.core.security import hash_password

def run():
    db: Session = SessionLocal()
    try:
        if not db.query(User).first():
            u = User(email="alice@example.com", username="Alice Nguyen",
                     password_hash=hash_password("alice123"))
            db.add(u)
        if not db.query(Place).first():
            db.add_all([
                Place(name="Cafe Yên", address="Q1", rating=4.5, lat=10.77, lon=106.70),
                Place(name="Bún bò", address="Q3", rating=4.2, lat=10.78, lon=106.68),
            ])
        db.commit()
        print("✅ Seed OK")
    finally:
        db.close()

if __name__ == "__main__":
    run()
