def test_root_ok(client):
    response = client.get("/")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "message": "Nostressia API is running",
    }


def test_root_with_query_ok(client):
    response = client.get("/?logs=container")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "message": "Nostressia API is running",
    }


def test_health_ok(client):
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
