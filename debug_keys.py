
import os
from dotenv import load_dotenv

# Force load .env from the root
load_dotenv(".env")
print(f"DATABASE_URL: {os.getenv('DATABASE_URL')}")

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from src.database import APIKey, User

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

try:
    # Try to find user ID 3 (enaihouwaspaul@gmail.com)
    user = db.query(User).filter(User.id == 3).first()
    print(f"User found: {user.email if user else 'None'}")
    
    if user:
        keys = db.query(APIKey).filter(APIKey.user_id == user.id).all()
        print(f"Keys found: {len(keys)}")
        for k in keys:
            print(f"- {k.name}: {k.key[:10]}...")
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
finally:
    db.close()
