from __future__ import annotations


def test_validate_golden_case_post_route(client):
    response = client.post("/api/v1/qa/validate-golden-case")
    assert response.status_code == 200
    body = response.json()
    assert body["total_failed"] == 0
    assert body["total_passed"] > 0
