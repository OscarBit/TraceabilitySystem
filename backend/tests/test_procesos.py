import pytest

def test_get_procesos(client, auth_headers_admin, auth_headers_operador):
    # Empty initially
    response = client.get("/procesos/", headers=auth_headers_operador)
    assert response.status_code == 200
    assert len(response.json()) == 0

def test_create_proceso_admin(client, auth_headers_admin):
    response = client.post("/procesos/", headers=auth_headers_admin, json={
        "nombre": "Brillo",
        "descripcion": "Proceso de dar brillo final"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["nombre"] == "Brillo"
    assert "id" in data

def test_create_proceso_operador_forbidden(client, auth_headers_operador):
    response = client.post("/procesos/", headers=auth_headers_operador, json={
        "nombre": "Corte Especial"
    })
    assert response.status_code == 403

def test_delete_proceso(client, auth_headers_admin):
    # First create
    create_resp = client.post("/procesos/", headers=auth_headers_admin, json={"nombre": "Temp"})
    proc_id = create_resp.json()["id"]
    
    # Delete it
    del_resp = client.delete(f"/procesos/{proc_id}", headers=auth_headers_admin)
    assert del_resp.status_code == 200
    
    # Verify gone
    get_resp = client.get("/procesos/", headers=auth_headers_admin)
    assert len([p for p in get_resp.json() if p["id"] == proc_id]) == 0
