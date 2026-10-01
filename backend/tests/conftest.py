import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.main import app as fastapi_app
from app.database import Base, get_db
from app.auth import create_access_token
import app.models

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

fastapi_app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="session")
def client():
    return TestClient(fastapi_app)

@pytest.fixture(scope="session")
def test_db():
    return TestingSessionLocal

@pytest.fixture(scope="session", autouse=True)
def setup_db(test_db):
    db = test_db()
    if not db.query(app.models.Persona).filter_by(id=1).first():
        test_client = app.models.Persona(id=1, nombre="Test Client", rol="Operador", username="testuser", password_hash="hash", cedula="1", telefono="1")
        admin_client = app.models.Persona(id=2, nombre="Test Admin", rol="Administrador", username="adminuser", password_hash="hash", cedula="2", telefono="2")
        db.add(test_client)
        db.add(admin_client)
        db.commit()
    db.close()

@pytest.fixture(scope="module")
def auth_headers_operador():
    token = create_access_token({"sub": "testuser", "rol": "Operador"})
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture(scope="module")
def auth_headers_admin():
    token = create_access_token({"sub": "adminuser", "rol": "Administrador"})
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture(scope="module")
def auth_headers(auth_headers_operador):
    return auth_headers_operador
