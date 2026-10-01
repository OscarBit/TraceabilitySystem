import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import sys
import os
import pyotp

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.main import app as fastapi_app
from app.database import Base, get_db
from app.auth import get_password_hash
import app.models


@pytest.fixture(scope="session", autouse=True)
def setup_users(test_db):
    db = test_db()
    if not db.query(app.models.Persona).filter_by(username="operador_auth").first():
        operador = app.models.Persona(
            id=4, 
            nombre="Test Operador Auth", 
            rol=app.models.RolPersona.Operador, 
            username="operador_auth", 
            password_hash=get_password_hash("password123"),
            cedula="111111",
            telefono="3000000000"
        )
        
        admin = app.models.Persona(
            id=5, 
            nombre="Test Admin Auth", 
            rol=app.models.RolPersona.Administrador, 
            username="admin_auth", 
            password_hash=get_password_hash("password123"),
            cedula="222222",
            telefono="3111111111"
        )
        
        db.add(operador)
        db.add(admin)
        db.commit()
    db.close()

def test_login_operador_success(client, setup_users):
    """Operador should login directly without 2FA."""
    response = client.post(
        "/auth/token",
        data={"username": "operador_auth", "password": "password123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["rol"] == "Operador"

def test_login_admin_first_time(client, setup_users):
    """Admin login first time should return 403 2FA_SETUP_REQUIRED with Provisioning URI."""
    response = client.post(
        "/auth/token",
        data={"username": "admin_auth", "password": "password123"}
    )
    assert response.status_code == 403
    assert response.json()["detail"] == "2FA_SETUP_REQUIRED"
    assert "x-provisioning-uri" in response.headers
    assert "otpauth://totp/GemStoneX:admin_auth" in response.headers["x-provisioning-uri"]

def test_login_admin_missing_code(client):
    """Admin login second time (without code) should return 403 2FA_REQUIRED."""
    response = client.post(
        "/auth/token",
        data={"username": "admin_auth", "password": "password123"}
    )
    assert response.status_code == 403
    assert response.json()["detail"] == "2FA_REQUIRED"

def test_login_admin_wrong_code(client):
    """Admin login with wrong TOTP code should return 401."""
    response = client.post(
        "/auth/token",
        data={
            "username": "admin_auth", 
            "password": "password123",
            "two_factor_code": "000000"
        }
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Código 2FA incorrecto"

def test_login_admin_correct_code(client, test_db):
    """Admin login with correct TOTP code should return 200."""
    # First, get the secret from DB
    db = test_db()
    admin = db.query(app.models.Persona).filter_by(username="admin_auth").first()
    secret = admin.totp_secret
    db.close()
    
    # Generate current TOTP code
    totp = pyotp.TOTP(secret)
    current_code = totp.now()
    
    response = client.post(
        "/auth/token",
        data={
            "username": "admin_auth", 
            "password": "password123",
            "two_factor_code": current_code
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["rol"] == "Administrador"
