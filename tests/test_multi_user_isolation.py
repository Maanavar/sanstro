from __future__ import annotations

from app.core.auth import create_access_token


def _register_user(raw_client, email: str, password: str = "password123") -> dict:
    response = raw_client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password},
    )
    assert response.status_code == 200
    return response.json()


def _auth_headers(user_id: str) -> dict[str, str]:
    token = create_access_token(subject=user_id)
    return {"Authorization": f"Bearer {token}"}


def test_birth_profiles_are_isolated_between_users(raw_client, birth_profile_payload_factory):
    user_a = _register_user(raw_client, "isolation-a@example.com")
    user_b = _register_user(raw_client, "isolation-b@example.com")
    headers_a = _auth_headers(user_a["userId"])
    headers_b = _auth_headers(user_b["userId"])

    create_response = raw_client.post(
        "/api/v1/birth-profiles",
        headers=headers_a,
        json=birth_profile_payload_factory(
            owner_user_id=user_b["userId"],
            display_name="User A Profile",
            calculate_now=False,
        ),
    )
    assert create_response.status_code == 200
    birth_profile_id = create_response.json()["data"]["birthProfileId"]

    owner_get = raw_client.get(f"/api/v1/birth-profiles/{birth_profile_id}", headers=headers_a)
    assert owner_get.status_code == 200
    owner_body = owner_get.json()["data"]
    assert owner_body["birthProfileId"] == birth_profile_id
    assert owner_body["ownerUserId"] == user_a["userId"]

    foreign_get = raw_client.get(f"/api/v1/birth-profiles/{birth_profile_id}", headers=headers_b)
    assert foreign_get.status_code == 403

    foreign_delete = raw_client.delete(f"/api/v1/birth-profiles/{birth_profile_id}", headers=headers_b)
    assert foreign_delete.status_code == 403

    owner_still_has_profile = raw_client.get(f"/api/v1/birth-profiles/{birth_profile_id}", headers=headers_a)
    assert owner_still_has_profile.status_code == 200

    no_profile_for_user_b = raw_client.get("/api/v1/birth-profiles/me/latest", headers=headers_b)
    assert no_profile_for_user_b.status_code == 404


def test_family_vaults_and_members_are_isolated_between_users(
    raw_client,
    family_vault_payload_factory,
    family_member_payload_factory,
):
    user_a = _register_user(raw_client, "vault-owner-a@example.com")
    user_b = _register_user(raw_client, "vault-owner-b@example.com")
    headers_a = _auth_headers(user_a["userId"])
    headers_b = _auth_headers(user_b["userId"])

    create_vault = raw_client.post(
        "/api/v1/family-vaults",
        headers=headers_a,
        json=family_vault_payload_factory("Owner A Vault"),
    )
    assert create_vault.status_code == 200
    family_vault_id = create_vault.json()["data"]["familyVaultId"]

    add_member = raw_client.post(
        f"/api/v1/family-vaults/{family_vault_id}/members",
        headers=headers_a,
        json=family_member_payload_factory(
            owner_user_id=user_b["userId"],
            display_name="Owner A Member",
            calculate_now=False,
        ),
    )
    assert add_member.status_code == 200
    member_body = add_member.json()["data"]
    family_member_id = member_body["familyMemberId"]
    assert member_body["ownerUserId"] == user_a["userId"]

    user_b_list = raw_client.get("/api/v1/family-vaults", headers=headers_b)
    assert user_b_list.status_code == 200
    assert user_b_list.json()["data"]["totalCount"] == 0
    assert user_b_list.json()["data"]["items"] == []

    assert raw_client.get(f"/api/v1/family-vaults/{family_vault_id}", headers=headers_b).status_code == 403
    assert raw_client.get(f"/api/v1/family-vaults/{family_vault_id}/members", headers=headers_b).status_code == 403
    assert raw_client.get(
        f"/api/v1/family-vaults/{family_vault_id}/members/{family_member_id}",
        headers=headers_b,
    ).status_code == 403
    assert raw_client.patch(
        f"/api/v1/family-vaults/{family_vault_id}/members/{family_member_id}",
        headers=headers_b,
        json={"displayName": "Hacked Name"},
    ).status_code == 403
    assert raw_client.delete(
        f"/api/v1/family-vaults/{family_vault_id}/members/{family_member_id}",
        headers=headers_b,
    ).status_code == 403
    assert raw_client.delete(f"/api/v1/family-vaults/{family_vault_id}", headers=headers_b).status_code == 403

    owner_member_after_attempts = raw_client.get(
        f"/api/v1/family-vaults/{family_vault_id}/members/{family_member_id}",
        headers=headers_a,
    )
    assert owner_member_after_attempts.status_code == 200
    assert owner_member_after_attempts.json()["data"]["displayName"] == "Owner A Member"
