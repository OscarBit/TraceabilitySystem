import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

# SQLite by default. In the container this resolves to /app/data, which is the
# mounted volume, so the database survives image rebuilds.
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./data/gemstone.db")

# check_same_thread is a SQLite-only connect argument.
connect_args = (
    {"check_same_thread": False}
    if SQLALCHEMY_DATABASE_URL.startswith("sqlite")
    else {}
)

# Create the directory holding a local SQLite file before connecting.
if SQLALCHEMY_DATABASE_URL.startswith("sqlite:///"):
    _db_path = SQLALCHEMY_DATABASE_URL.replace("sqlite:///", "", 1)
    _db_dir = os.path.dirname(_db_path)
    if _db_dir:
        os.makedirs(_db_dir, exist_ok=True)

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
