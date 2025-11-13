import pytest
import requests
import os
from dotenv import load_dotenv
import uuid

load_dotenv()

API_URL_TEST = os.getenv('API_URL_TEST')
AUTH_ROUTES_URL = f"{API_URL_TEST}/auth"
USER_ROUTES_URL = f"{API_URL_TEST}/user"

def generate_mail():
    return f"michel{uuid.uuid4().hex[:8]}@mail-de.merde"


@pytest.fixture
def test_register_data():
    return {
        "email": generate_mail(),
        "password": "PasDInspiDeso",
        "name": "michel",
        "surname": "michelAussi"
    }

@pytest.fixture
def test_login_data(test_register_data):
    return {
        "email": test_register_data["email"],
        "password": test_register_data["password"]
    }

@pytest.fixture
def create_test_user(test_register_data):
    response = requests.post(f"{AUTH_ROUTES_URL}/register", json=test_register_data)
    user_data = response.json()
    yield user_data
    if "user" in user_data and "id" in user_data["user"]:
        try:
            requests.delete(f"{USER_ROUTES_URL}/{user_data['user']['id']}")
        except:
            pass

class TestAuth:
    def test_register(self, test_register_data):
        response = requests.post(f"{AUTH_ROUTES_URL}/register", json=test_register_data)
        assert response.status_code == 201
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        user = data["user"]
        assert "id" in user
        assert user["email"] == test_register_data["email"]
        assert user["name"] == test_register_data["name"]
        assert user["surname"] == test_register_data["surname"]
        assert "pwd_hash" not in user
        assert isinstance(data["access_token"], str)
        assert len(data["access_token"]) > 0
        requests.delete(f"{USER_ROUTES_URL}/{user['id']}")

    def test_register_duplicate_email(self):
        unique_data = {
            "email": generate_mail(),
            "password": "PasDInspiDeso",
            "name": "michel",
            "surname": "michelAussi"
        }
        first_response = requests.post(f"{AUTH_ROUTES_URL}/register", json=unique_data)
        assert first_response.status_code == 201
        user_id = first_response.json()["user"]["id"]
        second_response = requests.post(f"{AUTH_ROUTES_URL}/register", json=unique_data)
        assert second_response.status_code == 409
        data = second_response.json()
        assert "message" in data
        assert "Email already in use" in data["message"]
        requests.delete(f"{USER_ROUTES_URL}/{user_id}")

    def test_register_invalid_email(self):
        invalid_data = {
            "email": "micheltoutcourt",
            "password": "pasDinspideso",
            "name": "michel",
            "surname": "michelAussi"
        }
        response = requests.post(f"{AUTH_ROUTES_URL}/register", json=invalid_data)
        assert response.status_code == 400

    def test_register_too_short_password(self):
        invalid_data = {
            "email": generate_mail(),
            "password": "12345",
            "name": "michel",
            "surname": "michelAussi"
        }
        response = requests.post(f"{AUTH_ROUTES_URL}/register", json=invalid_data)
        assert response.status_code == 400

    def test_register_inconplete(self):
        incomplete_data = {
            "email": generate_mail(),
            "password": "pasDinspideso"
        }
        response = requests.post(f"{AUTH_ROUTES_URL}/register", json=incomplete_data)
        assert response.status_code == 400

    def test_login(self, create_test_user, test_login_data):
        response = requests.post(f"{AUTH_ROUTES_URL}/login", json=test_login_data)
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        user = data["user"]
        assert "id" in user
        assert user["email"] == test_login_data["email"]
        assert user["name"] == "michel"
        assert user["surname"] == "michelAussi"
        assert "pwd_hash" not in user
        assert isinstance(data["access_token"], str)
        assert len(data["access_token"]) > 0

    def test_login_wrong_password(self, create_test_user, test_login_data):
        wrong_credentials = {
            "email": test_login_data["email"],
            "password": "pasbonpwd"
        }
        response = requests.post(f"{AUTH_ROUTES_URL}/login", json=wrong_credentials)
        assert response.status_code == 401
        data = response.json()
        assert "message" in data
        assert "Invalid credentials" in data["message"]

    def test_login_wtf_user(self):
        nonexistent_credentials = {
            "email": generate_mail(),
            "password": "pasDinspideso"
        }
        response = requests.post(f"{AUTH_ROUTES_URL}/login", json=nonexistent_credentials)
        assert response.status_code == 401
        data = response.json()
        assert "message" in data
        assert "Invalid credentials" in data["message"]

    def test_login_invalid_email(self):
        invalid_credentials = {
            "email": "mailfoireux",
            "password": "pasDinspideso"
        }
        response = requests.post(f"{AUTH_ROUTES_URL}/login", json=invalid_credentials)
        assert response.status_code == 400

    def test_me(self, create_test_user):
        token = create_test_user["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{AUTH_ROUTES_URL}/me", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["email"] == create_test_user["user"]["email"]
        assert data["name"] == "michel"
        assert data["surname"] == "michelAussi"
        assert "pwd_hash" not in data

    def test_me_no_token(self):
        response = requests.get(f"{AUTH_ROUTES_URL}/me")
        assert response.status_code == 401
        data = response.json()
        assert "message" in data

    def test_me_invalid_token(self):
        headers = {"Authorization": "Bearer invalid_token_here"}
        response = requests.get(f"{AUTH_ROUTES_URL}/me", headers=headers)
        assert response.status_code == 401
        data = response.json()
        assert "message" in data

    def test_me_lorenzo_header(self):
        headers = {"Authorization": "invalid_format"}
        response = requests.get(f"{AUTH_ROUTES_URL}/me", headers=headers)
        assert response.status_code == 401

    def test_full_auth(self):
        unique_data = {
            "email": generate_mail(),
            "password": "PasDInspiDeso",
            "name": "michel",
            "surname": "michelAussi"
        }
        register_response = requests.post(
            f"{AUTH_ROUTES_URL}/register",
            json=unique_data
        )
        assert register_response.status_code == 201
        register_data = register_response.json()
        user_id = register_data["user"]["id"]
        login_credentials = {
            "email": unique_data["email"],
            "password": unique_data["password"]
        }
        login_response = requests.post(
            f"{AUTH_ROUTES_URL}/login",
            json=login_credentials
        )
        assert login_response.status_code == 200
        login_data = login_response.json()
        token = login_data["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        me_response = requests.get(f"{AUTH_ROUTES_URL}/me", headers=headers)
        assert me_response.status_code == 200
        me_data = me_response.json()
        assert me_data["id"] == user_id
        assert me_data["email"] == unique_data["email"]
        requests.delete(f"{USER_ROUTES_URL}/{user_id}")
