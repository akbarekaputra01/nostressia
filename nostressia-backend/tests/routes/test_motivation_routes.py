def test_create_and_list_motivations(client, db_session):
    response = client.post(
        "/api/motivations/",
        json={"quote": "Keep going.", "authorName": "Admin", "uploaderId": 1},
    )
    assert response.status_code == 200
    created = response.json()["data"]
    assert created["quote"] == "Keep going."

    list_response = client.get("/api/motivations/")
    assert list_response.status_code == 200
    items = list_response.json()["data"]
    assert any(item["quote"] == "Keep going." for item in items)
