import pytest

def test_get_ubicaciones_seeds_and_returns(client, auth_headers_operador):
    res = client.get("/ubicaciones/", headers=auth_headers_operador)
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 6
    names = [u["nombre"] for u in data]
    assert "Recepción" in names
    assert "Bóveda / Caja Fuerte" in names
    assert "Área de Desbaste" in names
    assert "Área de Talla" in names
    assert "En manos del Cliente" in names

def test_create_ubicacion_admin(client, auth_headers_admin):
    res = client.post(
        "/ubicaciones/",
        json={"nombre": "Laboratorio de Gemología"},
        headers=auth_headers_admin
    )
    assert res.status_code == 200
    data = res.json()
    assert data["nombre"] == "Laboratorio de Gemología"
    assert "id" in data

def test_create_ubicacion_operador_forbidden(client, auth_headers_operador):
    res = client.post(
        "/ubicaciones/",
        json={"nombre": "Zona Restringida"},
        headers=auth_headers_operador
    )
    assert res.status_code == 403
