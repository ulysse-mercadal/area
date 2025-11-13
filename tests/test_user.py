import pytest
import requests
import os
from dotenv import load_dotenv
import uuid
import psycopg2
from psycopg2.extras import RealDictCursor

load_dotenv()

API_URL_TEST = os.getenv('API_URL_TEST')
AUTH_ROUTES_URL = f"{API_URL_TEST}/auth"
USER_ROUTES_URL = f"{API_URL_TEST}/user"
DB_HOST = os.getenv('DB_HOST')
DB_PORT = "5432"
DB_NAME = os.getenv('DATABASE_NAME')
DB_USER = os.getenv('DATABASE_USERNAME')
DB_PASSWORD = os.getenv('DATABASE_PASSWORD')

def generate_mail():
    return f"user{uuid.uuid4().hex[:8]}@test.com"

def get_db_connection():
    return psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD
    )

def create_user_in_db(email, pwd_hash, name, surname, role="USER"):
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                INSERT INTO "User" (email, pwd_hash, name, surname, role, "createdAt", "updatedAt")
                VALUES (%s, %s, %s, %s, %s, NOW(), NOW())
                RETURNING id, email, name, surname, role
                """,
                (email, pwd_hash, name, surname, role)
            )
            user = cur.fetchone()
            conn.commit()
            return dict(user)
    finally:
        conn.close()

def delete_user_from_db(user_id):
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute('DELETE FROM "User" WHERE id = %s', (user_id,))
            conn.commit()
    finally:
        conn.close()

@pytest.fixture
def test_user_data():
    return {
        "email": generate_mail(),
        "password": "TestPassword123",
        "name": "Jean",
        "surname": "Dupont"
    }

@pytest.fixture
def test_admin_data():
    return {
        "email": generate_mail(),
        "password": "AdminPassword123",
        "name": "Admin",
        "surname": "User"
    }

@pytest.fixture
def created_user(test_user_data):
    """Create a regular user and return user data with token"""
    response = requests.post(f"{AUTH_ROUTES_URL}/register", json=test_user_data)
    user_data = response.json()
    yield user_data
    if "user" in user_data and "id" in user_data["user"]:
        try:
            requests.delete(
                f"{USER_ROUTES_URL}/{user_data['user']['id']}",
                headers={"Authorization": f"Bearer {user_data['access_token']}"}
            )
        except:
            pass

@pytest.fixture
def created_admin():
    import bcrypt
    admin_email = generate_mail()
    pwd_hash = bcrypt.hashpw("AdminPassword123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    admin_user = create_user_in_db(admin_email, pwd_hash, "Admin", "User", "ADMIN")
    login_response = requests.post(
        f"{AUTH_ROUTES_URL}/login",
        json={"email": admin_email, "password": "AdminPassword123"}
    )
    login_data = login_response.json()
    yield {
        "user": admin_user,
        "access_token": login_data["access_token"]
    }
    try:
        delete_user_from_db(admin_user['id'])
    except:
        pass

@pytest.fixture
def second_user():
    user_data = {
        "email": generate_mail(),
        "password": "SecondUserPassword123",
        "name": "Pierre",
        "surname": "Martin"
    }
    response = requests.post(f"{AUTH_ROUTES_URL}/register", json=user_data)
    user_response = response.json()
    yield user_response
    if "user" in user_response and "id" in user_response["user"]:
        try:
            requests.delete(
                f"{USER_ROUTES_URL}/{user_response['user']['id']}",
                headers={"Authorization": f"Bearer {user_response['access_token']}"}
            )
        except:
            pass

class TestUserCRUD:
    def test_create_user(self, test_user_data):
        response = requests.post(f"{USER_ROUTES_URL}", json=test_user_data)
        assert response.status_code == 201
        data = response.json()
        assert "id" in data
        assert data["email"] == test_user_data["email"]
        assert data["name"] == test_user_data["name"]
        assert data["surname"] == test_user_data["surname"]
        assert "pwd_hash" not in data
        requests.delete(f"{USER_ROUTES_URL}/{data['id']}")

    def test_create_user_duplicate_email(self, created_user):
        duplicate_data = {
            "email": created_user["user"]["email"],
            "password": "AnotherPassword123",
            "name": "Another",
            "surname": "User"
        }
        response = requests.post(f"{USER_ROUTES_URL}", json=duplicate_data)
        assert response.status_code == 409

    def test_create_user_invalid_data(self):
        invalid_data = {
            "email": "not-an-email",
            "password": "short",
            "name": "Test"
        }
        response = requests.post(f"{USER_ROUTES_URL}", json=invalid_data)
        assert response.status_code == 400

    def test_get_all_users_as_admin(self, created_admin, created_user):
        headers = {"Authorization": f"Bearer {created_admin['access_token']}"}
        response = requests.get(f"{USER_ROUTES_URL}", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 2

    def test_get_all_users_as_regular_user(self, created_user):
        headers = {"Authorization": f"Bearer {created_user['access_token']}"}
        response = requests.get(f"{USER_ROUTES_URL}", headers=headers)
        assert response.status_code == 403
        data = response.json()
        assert "message" in data

    def test_get_all_users_no_token(self):
        response = requests.get(f"{USER_ROUTES_URL}")
        assert response.status_code == 401

    def test_get_own_user_info(self, created_user):
        user_id = created_user["user"]["id"]
        headers = {"Authorization": f"Bearer {created_user['access_token']}"}
        response = requests.get(f"{USER_ROUTES_URL}/{user_id}", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == user_id
        assert data["email"] == created_user["user"]["email"]
        assert "pwd_hash" not in data

    def test_get_other_user_info_as_regular_user(self, created_user, second_user):
        other_user_id = second_user["user"]["id"]
        headers = {"Authorization": f"Bearer {created_user['access_token']}"}
        response = requests.get(f"{USER_ROUTES_URL}/{other_user_id}", headers=headers)
        assert response.status_code == 403

    def test_get_user_info_as_admin(self, created_admin, created_user):
        user_id = created_user["user"]["id"]
        headers = {"Authorization": f"Bearer {created_admin['access_token']}"}
        response = requests.get(f"{USER_ROUTES_URL}/{user_id}", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == user_id

    def test_get_nonexistent_user(self, created_admin):
        headers = {"Authorization": f"Bearer {created_admin['access_token']}"}
        response = requests.get(f"{USER_ROUTES_URL}/999999", headers=headers)
        assert response.status_code == 404

    def test_update_own_user(self, created_user):
        user_id = created_user["user"]["id"]
        headers = {"Authorization": f"Bearer {created_user['access_token']}"}
        update_data = {
            "name": "UpdatedName",
            "surname": "UpdatedSurname"
        }
        response = requests.patch(
            f"{USER_ROUTES_URL}/{user_id}",
            json=update_data,
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "UpdatedName"
        assert data["surname"] == "UpdatedSurname"
        assert data["email"] == created_user["user"]["email"]

    def test_update_other_user_as_regular_user(self, created_user, second_user):
        other_user_id = second_user["user"]["id"]
        headers = {"Authorization": f"Bearer {created_user['access_token']}"}
        update_data = {"name": "HackedName"}
        response = requests.patch(
            f"{USER_ROUTES_URL}/{other_user_id}",
            json=update_data,
            headers=headers
        )
        assert response.status_code == 403

    def test_update_user_as_admin(self, created_admin, created_user):
        user_id = created_user["user"]["id"]
        headers = {"Authorization": f"Bearer {created_admin['access_token']}"}
        update_data = {"name": "AdminUpdatedName"}
        response = requests.patch(
            f"{USER_ROUTES_URL}/{user_id}",
            json=update_data,
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "AdminUpdatedName"

    def test_update_user_no_token(self, created_user):
        user_id = created_user["user"]["id"]
        update_data = {"name": "NoToken"}
        response = requests.patch(f"{USER_ROUTES_URL}/{user_id}", json=update_data)
        assert response.status_code == 401

    def test_update_user_invalid_data(self, created_user):
        user_id = created_user["user"]["id"]
        headers = {"Authorization": f"Bearer {created_user['access_token']}"}
        update_data = {"email": "invalid-email-format"}
        response = requests.patch(
            f"{USER_ROUTES_URL}/{user_id}",
            json=update_data,
            headers=headers
        )
        assert response.status_code == 400

    def test_delete_own_user(self):
        user_data = {
            "email": generate_mail(),
            "password": "ToBeDeleted123",
            "name": "Delete",
            "surname": "Me"
        }
        register_response = requests.post(f"{AUTH_ROUTES_URL}/register", json=user_data)
        user_response = register_response.json()
        user_id = user_response["user"]["id"]
        token = user_response["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.delete(f"{USER_ROUTES_URL}/{user_id}", headers=headers)
        assert response.status_code == 204
        get_response = requests.get(f"{USER_ROUTES_URL}/{user_id}", headers=headers)
        assert get_response.status_code in [401, 404]

    def test_delete_other_user_as_regular_user(self, created_user, second_user):
        other_user_id = second_user["user"]["id"]
        headers = {"Authorization": f"Bearer {created_user['access_token']}"}
        response = requests.delete(f"{USER_ROUTES_URL}/{other_user_id}", headers=headers)
        assert response.status_code == 403

    def test_delete_user_as_admin(self, created_admin):
        user_data = {
            "email": generate_mail(),
            "password": "DeleteByAdmin123",
            "name": "ToDelete",
            "surname": "ByAdmin"
        }
        register_response = requests.post(f"{AUTH_ROUTES_URL}/register", json=user_data)
        user_id = register_response.json()["user"]["id"]
        headers = {"Authorization": f"Bearer {created_admin['access_token']}"}
        response = requests.delete(f"{USER_ROUTES_URL}/{user_id}", headers=headers)
        assert response.status_code == 204

    def test_delete_user_no_token(self, created_user):
        user_id = created_user["user"]["id"]
        response = requests.delete(f"{USER_ROUTES_URL}/{user_id}")
        assert response.status_code == 401

    def test_delete_nonexistent_user(self, created_admin):
        headers = {"Authorization": f"Bearer {created_admin['access_token']}"}
        response = requests.delete(f"{USER_ROUTES_URL}/999999", headers=headers)
        assert response.status_code == 404

    def test_delete_user_invalid_token(self, created_user):
        user_id = created_user["user"]["id"]
        headers = {"Authorization": "Bearer invalid_token_lol"}
        response = requests.delete(f"{USER_ROUTES_URL}/{user_id}", headers=headers)
        assert response.status_code == 401

    def test_full_user_lifecycle(self):
        user_data = {
            "email": generate_mail(),
            "password": "LifecycleTest123",
            "name": "Lifecycle",
            "surname": "Test"
        }
        register_response = requests.post(f"{AUTH_ROUTES_URL}/register", json=user_data)
        assert register_response.status_code == 201
        user_response = register_response.json()
        user_id = user_response["user"]["id"]
        token = user_response["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        get_response = requests.get(f"{USER_ROUTES_URL}/{user_id}", headers=headers)
        assert get_response.status_code == 200
        assert get_response.json()["email"] == user_data["email"]
        update_data = {"name": "UpdatedLifecycle"}
        update_response = requests.patch(
            f"{USER_ROUTES_URL}/{user_id}",
            json=update_data,
            headers=headers
        )
        assert update_response.status_code == 200
        assert update_response.json()["name"] == "UpdatedLifecycle"
        delete_response = requests.delete(f"{USER_ROUTES_URL}/{user_id}", headers=headers)
        assert delete_response.status_code == 204

    def test_admin_privileges(self, created_admin):
        admin_headers = {"Authorization": f"Bearer {created_admin['access_token']}"}
        user_data = {
            "email": generate_mail(),
            "password": "AdminTest123",
            "name": "TestUser",
            "surname": "ForAdmin"
        }
        create_response = requests.post(f"{AUTH_ROUTES_URL}/register", json=user_data)
        test_user_id = create_response.json()["user"]["id"]
        try:
            list_response = requests.get(f"{USER_ROUTES_URL}", headers=admin_headers)
            assert list_response.status_code == 200
            get_response = requests.get(f"{USER_ROUTES_URL}/{test_user_id}", headers=admin_headers)
            assert get_response.status_code == 200
            update_response = requests.patch(
                f"{USER_ROUTES_URL}/{test_user_id}",
                json={"name": "AdminModified"},
                headers=admin_headers
            )
            assert update_response.status_code == 200
            delete_response = requests.delete(f"{USER_ROUTES_URL}/{test_user_id}", headers=admin_headers)
            assert delete_response.status_code == 204
        finally:
            try:
                requests.delete(f"{USER_ROUTES_URL}/{test_user_id}", headers=admin_headers)
            except:
                pass
