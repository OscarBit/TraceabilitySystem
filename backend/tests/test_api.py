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


def test_unauthorized_access(client):
    # Try to access a protected route without token
    response = client.get("/dashboard/stats")
    assert response.status_code == 401

# Use a class to hold state between tests or pass from one to another
class TestState:
    test_piedras = []

def test_create_lote(client, auth_headers, setup_db):
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

def test_stone_weight_exceeds_ingreso(client, auth_headers):
    piedra = TestState.test_piedras[0]
    piedra_id = piedra["id"]
    qr_token = piedra["qr_token"]
    
    # 1. Update status to Ingreso with weight 3.0
    client.post(f"/piedras/{piedra_id}/estado", json={
        "estado": "Ingreso",
        "peso_ct": 3.0,
        "notas": "Initial",
        "qr_token": qr_token
    }, headers=auth_headers)
    
    # 2. Try to update to Desbaste with weight 3.5 (should fail)
    res = client.post(f"/piedras/{piedra_id}/estado", json={
        "estado": "Desbaste",
        "peso_ct": 3.5,
        "notas": "Exceeds weight",
        "qr_token": qr_token
    }, headers=auth_headers)
    assert res.status_code == 400
    assert "peso no puede ser mayor al de Ingreso" in res.json()["detail"]

def test_stone_weight_exceeds_lote(client, auth_headers):
    # Create a new Lote
    response = client.post(
        "/lotes/",
        json={"cliente_id": 1, "cantidad_piedras": 2, "peso_total_ct": 10.0, "responsable_id": 1},
        headers=auth_headers
    )
    new_piedras = response.json()["piedras_generadas"]
    pid1 = new_piedras[0]["id"]
    qr1 = new_piedras[0]["qr_token"]
    pid2 = new_piedras[1]["id"]
    qr2 = new_piedras[1]["qr_token"]
    
    # Update pid1 to 9.0
    client.post(f"/piedras/{pid1}/estado", json={"estado": "Ingreso", "peso_ct": 9.0, "qr_token": qr1}, headers=auth_headers)
    
    # Update pid2 to 2.0 (9 + 2 = 11 > 10)
    res = client.post(f"/piedras/{pid2}/estado", json={"estado": "Ingreso", "peso_ct": 2.0, "qr_token": qr2}, headers=auth_headers)
    assert res.status_code == 400
    assert "excede el peso total del lote" in res.json()["detail"]

def test_anular_lote(client, auth_headers_admin, auth_headers_operador):
    response = client.post(
        "/lotes/",
        json={"cliente_id": 1, "cantidad_piedras": 2, "peso_total_ct": 10.0, "responsable_id": 1},
        headers=auth_headers_admin
    )
    assert response.status_code == 200, response.json()
    lote_id = response.json()["id"]

    resp_no_nota = client.post(f"/lotes/{lote_id}/anular", json={"nota": ""}, headers=auth_headers_admin)
    assert resp_no_nota.status_code == 422

    resp_operador = client.post(f"/lotes/{lote_id}/anular", json={"nota": "Bad lot"}, headers=auth_headers_operador)
    assert resp_operador.status_code == 403

    resp_ok = client.post(f"/lotes/{lote_id}/anular", json={"nota": "Error de digitacion"}, headers=auth_headers_admin)
    assert resp_ok.status_code == 200
    
    resp_get = client.get(f"/lotes/{lote_id}")
    assert resp_get.json()["is_active"] == 0
    assert resp_get.json()["motivo_anulacion"] == "Error de digitacion"


def test_qr_token_protection(client, auth_headers_admin, auth_headers_operador):
    # 1. Create a lote with stones
    resp = client.post(
        "/lotes/",
        json={"cliente_id": 1, "cantidad_piedras": 1, "peso_total_ct": 5.0, "responsable_id": 1},
        headers=auth_headers_admin
    )
    assert resp.status_code == 200
    lote_data = resp.json()
    piedra = lote_data["piedras_generadas"][0]
    piedra_id = piedra["id"]
    qr_token = piedra["qr_token"]
    assert qr_token is not None

    # 2. Operador without token should be blocked
    resp_no_token = client.get(f"/piedras/{piedra_id}/historial", headers=auth_headers_operador)
    assert resp_no_token.status_code == 403
    assert "código QR" in resp_no_token.json()["detail"]

    # 3. Operador with invalid token should be blocked
    resp_bad_token = client.get(f"/piedras/{piedra_id}/historial?token=fake-forged-token", headers=auth_headers_operador)
    assert resp_bad_token.status_code == 403
    assert "no válido" in resp_bad_token.json()["detail"]

    # 4. Operador with valid QR token succeeds
    resp_valid = client.get(f"/piedras/{piedra_id}/historial?token={qr_token}", headers=auth_headers_operador)
    assert resp_valid.status_code == 200

    # 5. Admin can access without QR token
    resp_admin = client.get(f"/piedras/{piedra_id}/historial", headers=auth_headers_admin)
    assert resp_admin.status_code == 200

