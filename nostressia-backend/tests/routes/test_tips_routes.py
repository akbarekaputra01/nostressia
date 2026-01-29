from app.models.tips_model import TipsCategory


def test_tips_crud_flow(client, db_session):
    # Create category
    response = client.post(
        "/api/tips/categories",
        json={"categoryName": "Sleep"},
    )
    assert response.status_code == 200
    category_id = response.json()["data"]["tipCategoryId"]

    # Create tip
    tip_response = client.post(
        "/api/tips/",
        json={
            "detail": "Sleep 7-8 hours.",
            "tipCategoryId": category_id,
            "uploaderId": 1,
        },
    )
    assert tip_response.status_code == 200
    tip_id = tip_response.json()["data"]["tipId"]

    # Get all tips
    list_response = client.get("/api/tips/")
    assert list_response.status_code == 200
    assert any(item["tipId"] == tip_id for item in list_response.json()["data"])

    # Get tip by id
    single_response = client.get(f"/api/tips/{tip_id}")
    assert single_response.status_code == 200
    assert single_response.json()["data"]["detail"] == "Sleep 7-8 hours."

    # Update tip
    update_response = client.put(
        f"/api/tips/{tip_id}",
        json={"detail": "Sleep earlier."},
    )
    assert update_response.status_code == 200
    assert update_response.json()["data"]["detail"] == "Sleep earlier."

    # Tips by category
    by_category = client.get(f"/api/tips/by-category/{category_id}")
    assert by_category.status_code == 200
    assert by_category.json()["data"]

    # Delete tip
    delete_response = client.delete(f"/api/tips/{tip_id}")
    assert delete_response.status_code == 200

    # Delete category
    delete_category = client.delete(f"/api/tips/categories/{category_id}")
    assert delete_category.status_code == 200


def test_tip_not_found_returns_404(client):
    response = client.get("/api/tips/999")
    assert response.status_code == 404


def test_delete_category_not_found(client, db_session):
    response = client.delete("/api/tips/categories/999")
    assert response.status_code == 404


def test_get_categories_returns_list(client, db_session):
    db_session.add(TipsCategory(category_name="Mood"))
    db_session.commit()

    response = client.get("/api/tips/categories")
    assert response.status_code == 200
    assert any(item["categoryName"] == "Mood" for item in response.json()["data"])
