def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


def test_root(client):
    r = client.get("/")
    assert r.status_code == 200
    assert r.json()["status"] == "running"


def test_register_login_me(client, auth_headers):
    r = client.get("/auth/me", headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["username"] == "testuser"


def test_project_session_analytics(client, auth_headers, test_project):
    assert test_project["name"] == "Test Project"

    session = client.post(
        "/sessions",
        json={
            "project_id": test_project["id"],
            "model": "claude-sonnet",
            "input_tokens": 1000,
            "output_tokens": 500,
        },
        headers=auth_headers,
    )
    assert session.status_code == 201
    body = session.json()
    assert body["cost_usd"] > 0

    summary = client.get("/analytics/summary", headers=auth_headers)
    assert summary.status_code == 200
    data = summary.json()
    assert data["total_sessions"] == 1
    assert data["total_input_tokens"] == 1000
