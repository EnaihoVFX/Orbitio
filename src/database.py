from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime, ForeignKey, text, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import os

from .config import settings
DATABASE_URL = settings.DATABASE_URL

# Create engine
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

# Enable WAL mode for better concurrency
if "sqlite" in DATABASE_URL:
    try:
        with engine.connect() as connection:
            connection.execute(text("PRAGMA journal_mode=WAL;"))
            connection.execute(text("PRAGMA synchronous=NORMAL;"))
    except Exception as e:
        print(f"Failed to set WAL mode: {e}")

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()

# User model
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    
    # Relationship to API keys
    api_keys = relationship("APIKey", back_populates="user")

# API Key model
class APIKey(Base):
    __tablename__ = "api_keys"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    key = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    
    # Relationship to user
    user = relationship("User", back_populates="api_keys")

# Request Log model
class RequestLog(Base):
    __tablename__ = "request_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    endpoint = Column(String(255))
    status_code = Column(Integer)
    latency_ms = Column(Float)
    api_key = Column(String(255), nullable=True)
    user_addr = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Create all tables
def init_db():
    print(f"DEBUG: init_db running. Tables: {Base.metadata.tables.keys()}")
    print(f"DEBUG: Engine URL: {engine.url}")
    Base.metadata.create_all(bind=engine)
    print("DEBUG: init_db complete.")
