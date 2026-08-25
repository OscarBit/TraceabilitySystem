import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import sys
import os

# Ensure app is in path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.main import app as fastapi_app
from app.database import Base, get_db
from app.auth import create_access_token
import app.models  # Import all models to register with Base

# Use an in-memory SQLite database for tests
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

client = TestClient(fastapi_app)

@pytest.fixture(scope="module")
def auth_headers():
    # Create a test token
    token = create_access_token({"sub": "testuser", "rol": "Operador"})
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture(scope="module")
def setup_db():
    # Setup initial database state like Persona
    db = TestingSessionLocal()
    test_client = app.models.Persona(id=1, nombre="Test Client", rol="Operador", username="testuser", password_hash="hash")
    db.add(test_client)
    db.commit()
    db.close()
    
def test_unauthorized_access():
    # Try to access a protected route without token
    response = client.get("/dashboard/stats")
    assert response.status_code == 401

# Use a class to hold state between tests or pass from one to another
class TestState:
    test_piedras = []

def test_create_lote(auth_headers, setup_db):
    response = client.post(
        "/lotes/",
        json={
            "cliente_id": 1,
            "cantidad_piedras": 2,
            "peso_total_ct": 10.0,
            "responsable_id": 1
        },
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["id"].startswith("GSX-")
    assert len(data["piedras_generadas"]) == 2
    TestState.test_piedras = data["piedras_generadas"]

def test_stone_weight_exceeds_ingreso(auth_headers):
    piedra_id = TestState.test_piedras[0]["id"]
    
    # 1. Update status to Ingreso with weight 3.0
    client.post(f"/piedras/{piedra_id}/estado", json={
        "estado": "Ingreso",
        "peso_ct": 3.0,
        "notas": "Initial"
    }, headers=auth_headers)
    
    # 2. Try to update to Desbaste with weight 3.5 (should fail)
    res = client.post(f"/piedras/{piedra_id}/estado", json={
        "estado": "Desbaste",
        "peso_ct": 3.5,
        "notas": "Exceeds weight"
    }, headers=auth_headers)
    assert res.status_code == 400
    assert "peso no puede ser mayor al de Ingreso" in res.json()["detail"]

def test_stone_weight_exceeds_lote(auth_headers):
    piedra_id = TestState.test_piedras[0]["id"]
    piedra_id_2 = TestState.test_piedras[1]["id"]
    
    # Update first stone to 9.0 (lote is 10.0)
    # Actually it's already 3.0 from previous test, let's just make it 9.0 by doing a new state, wait no we must not exceed Ingreso weight!
    # Ah, let's create a new Lote!
    response = client.post(
        "/lotes/",
        json={"cliente_id": 1, "cantidad_piedras": 2, "peso_total_ct": 10.0, "responsable_id": 1},
        headers=auth_headers
    )
    new_piedras = response.json()["piedras_generadas"]
    pid1 = new_piedras[0]["id"]
    pid2 = new_piedras[1]["id"]
    
    # Update pid1 to 9.0
    client.post(f"/piedras/{pid1}/estado", json={"estado": "Ingreso", "peso_ct": 9.0}, headers=auth_headers)
    
    # Update pid2 to 2.0 (9 + 2 = 11 > 10)
    res = client.post(f"/piedras/{pid2}/estado", json={"estado": "Ingreso", "peso_ct": 2.0}, headers=auth_headers)
    assert res.status_code == 400
    assert "excede el peso total del lote" in res.json()["detail"]
