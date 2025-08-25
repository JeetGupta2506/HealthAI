from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os

load_dotenv()

# Database connection string - supports both local and team shared database
# For team development, set TEAM_DATABASE_URL in .env file
# For local development, set LOCAL_DATABASE_URL or use default
TEAM_DATABASE_URL = os.getenv("TEAM_DATABASE_URL")
LOCAL_DATABASE_URL = os.getenv("LOCAL_DATABASE_URL", "postgresql://username:password@localhost:5432/healthchatbot")

# Use team database if available, otherwise fall back to local
DATABASE_URL = TEAM_DATABASE_URL or LOCAL_DATABASE_URL

print(f"Connecting to database: {DATABASE_URL}")

# Create engine
engine = create_engine(DATABASE_URL)

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Create all tables
def create_tables():
    from models import Base
    Base.metadata.create_all(bind=engine)