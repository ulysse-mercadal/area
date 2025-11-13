import pytest
import requests
import os
import random
import string
from dotenv import load_dotenv

load_dotenv()

API_URL_TEST = os.getenv('API_URL_TEST')
USER_ROUTES_URL = f"{API_URL_TEST}/user"
AUTH_ROUTES_URL = f"{API_URL_TEST}/auth"
WORKFLOW_ROUTES_URL = f"{API_URL_TEST}/workflow"

def generate_unique_email():
    random_str = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
    return f"test_{random_str}@example.com"

@pytest.fixture
def test_user_data():
    return {
        "email": generate_unique_email(),
        "password": "PasDInspiDeso",
        "name": "Michel",
        "surname": "MichelAussi"
    }

@pytest.fixture
def authenticated_user(test_user_data):
    response = requests.post(f"{AUTH_ROUTES_URL}/register", json=test_user_data)
    assert response.status_code == 201, f"Register failed: {response.status_code} - {response.text}"
    data = response.json()

    user_info = {
        "id": data["user"]["id"],
        "email": data["user"]["email"],
        "name": data["user"]["name"],
        "surname": data["user"]["surname"],
        "token": data["access_token"]
    }
    yield user_info
    try:
        headers = {"Authorization": f"Bearer {user_info['token']}"}
        requests.delete(f"{USER_ROUTES_URL}/{user_info['id']}", headers=headers)
    except:
        pass

@pytest.fixture
def authenticated_user2():
    user_data = {
        "email": generate_unique_email(),
        "password": "OtherPassword123",
        "name": "Other",
        "surname": "User"
    }
    response = requests.post(f"{AUTH_ROUTES_URL}/register", json=user_data)
    assert response.status_code == 201, f"Register failed: {response.status_code} - {response.text}"
    data = response.json()
    user_info = {
        "id": data["user"]["id"],
        "token": data["access_token"]
    }
    yield user_info
    try:
        headers = {"Authorization": f"Bearer {user_info['token']}"}
        requests.delete(f"{USER_ROUTES_URL}/{user_info['id']}", headers=headers)
    except:
        pass

@pytest.fixture
def test_workflow(authenticated_user):
    headers = {"Authorization": f"Bearer {authenticated_user['token']}"}
    workflow_data = {
        "name": "Test Workflow",
        "description": "A test workflow",
        "isActive": True
    }
    response = requests.post(WORKFLOW_ROUTES_URL, json=workflow_data, headers=headers)
    assert response.status_code == 201, f"Workflow creation failed: {response.status_code} - {response.text}"
    workflow = response.json()
    yield workflow
    try:
        requests.delete(f"{WORKFLOW_ROUTES_URL}/{workflow['id']}", headers=headers)
    except:
        pass

class TestWorkflowCRUD:
    def test_create_workflow(self, authenticated_user):
        headers = {"Authorization": f"Bearer {authenticated_user['token']}"}
        workflow_data = {
            "name": "Mon Premier Workflow",
            "description": "Un workflow de test",
            "isActive": True
        }
        response = requests.post(WORKFLOW_ROUTES_URL, json=workflow_data, headers=headers)
        assert response.status_code == 201
        data = response.json()
        assert "id" in data
        assert data["name"] == "Mon Premier Workflow"
        assert data["description"] == "Un workflow de test"
        assert data["isActive"] == True
        assert data["userId"] == authenticated_user["id"]
        assert "user" in data
        assert "nodes" in data
        assert "nodeConnections" in data
        requests.delete(f"{WORKFLOW_ROUTES_URL}/{data['id']}", headers=headers)

    def test_create_workflow_no_auth(self, authenticated_user):
        workflow_data = {
            "name": "Unauthorized Workflow"
        }
        response = requests.post(WORKFLOW_ROUTES_URL, json=workflow_data)
        assert response.status_code == 401

    def test_create_workflow_minimal(self, authenticated_user):
        headers = {"Authorization": f"Bearer {authenticated_user['token']}"}
        workflow_data = {
            "name": "Minimal Workflow"
        }
        response = requests.post(WORKFLOW_ROUTES_URL, json=workflow_data, headers=headers)
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Minimal Workflow"
        assert data["isActive"] == True
        assert data["description"] is None
        requests.delete(f"{WORKFLOW_ROUTES_URL}/{data['id']}", headers=headers)

    def test_create_workflow_incomplete(self, authenticated_user):
        headers = {"Authorization": f"Bearer {authenticated_user['token']}"}
        workflow_data = {
            "description": "Missing name"
        }
        response = requests.post(WORKFLOW_ROUTES_URL, json=workflow_data, headers=headers)
        assert response.status_code == 400

    def test_get_all_workflows(self, authenticated_user, test_workflow):
        headers = {"Authorization": f"Bearer {authenticated_user['token']}"}
        response = requests.get(WORKFLOW_ROUTES_URL, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        workflow_ids = [w["id"] for w in data]
        assert test_workflow["id"] in workflow_ids

    def test_get_all_workflows_no_auth(self):
        response = requests.get(WORKFLOW_ROUTES_URL)
        assert response.status_code == 401

    def test_get_all_workflows_user_isolation(self, authenticated_user, authenticated_user2):
        headers1 = {"Authorization": f"Bearer {authenticated_user['token']}"}
        headers2 = {"Authorization": f"Bearer {authenticated_user2['token']}"}
        workflow_data = {
            "name": "User 1 Workflow"
        }
        workflow1 = requests.post(WORKFLOW_ROUTES_URL, json=workflow_data, headers=headers1).json()
        response2 = requests.get(WORKFLOW_ROUTES_URL, headers=headers2)
        assert response2.status_code == 200
        data2 = response2.json()
        workflow_ids = [w["id"] for w in data2]
        assert workflow1["id"] not in workflow_ids
        requests.delete(f"{WORKFLOW_ROUTES_URL}/{workflow1['id']}", headers=headers1)

    def test_get_one_workflow(self, authenticated_user, test_workflow):
        headers = {"Authorization": f"Bearer {authenticated_user['token']}"}
        response = requests.get(f"{WORKFLOW_ROUTES_URL}/{test_workflow['id']}", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_workflow["id"]
        assert data["name"] == test_workflow["name"]
        assert "user" in data
        assert "nodes" in data
        assert "nodeConnections" in data
        assert "executions" in data

    def test_get_one_workflow_no_auth(self, test_workflow):
        response = requests.get(f"{WORKFLOW_ROUTES_URL}/{test_workflow['id']}")
        assert response.status_code == 401

    def test_get_one_workflow_wrong_user(self, authenticated_user, authenticated_user2, test_workflow):
        headers = {"Authorization": f"Bearer {authenticated_user2['token']}"}
        response = requests.get(f"{WORKFLOW_ROUTES_URL}/{test_workflow['id']}", headers=headers)
        assert response.status_code == 403

    def test_get_workflow_nonexistent(self, authenticated_user):
        headers = {"Authorization": f"Bearer {authenticated_user['token']}"}
        response = requests.get(f"{WORKFLOW_ROUTES_URL}/999999", headers=headers)
        assert response.status_code == 404

    def test_get_workflow_invalid_id(self, authenticated_user):
        headers = {"Authorization": f"Bearer {authenticated_user['token']}"}
        response = requests.get(f"{WORKFLOW_ROUTES_URL}/invalid", headers=headers)
        assert response.status_code in [400, 404]

    def test_update_workflow(self, authenticated_user, test_workflow):
        headers = {"Authorization": f"Bearer {authenticated_user['token']}"}
        update_data = {
            "name": "Updated Workflow Name",
            "description": "Updated description"
        }
        response = requests.patch(
            f"{WORKFLOW_ROUTES_URL}/{test_workflow['id']}",
            json=update_data,
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_workflow["id"]
        assert data["name"] == "Updated Workflow Name"
        assert data["description"] == "Updated description"

    def test_update_workflow_no_auth(self, test_workflow):
        update_data = {"name": "Hacked"}
        response = requests.patch(f"{WORKFLOW_ROUTES_URL}/{test_workflow['id']}", json=update_data)
        assert response.status_code == 401

    def test_update_workflow_wrong_user(self, authenticated_user2, test_workflow):
        headers = {"Authorization": f"Bearer {authenticated_user2['token']}"}
        update_data = {"name": "Hacked Workflow"}
        response = requests.patch(
            f"{WORKFLOW_ROUTES_URL}/{test_workflow['id']}",
            json=update_data,
            headers=headers
        )
        assert response.status_code == 403

    def test_update_workflow_isActive(self, authenticated_user, test_workflow):
        headers = {"Authorization": f"Bearer {authenticated_user['token']}"}
        update_data = {"isActive": False}
        response = requests.patch(
            f"{WORKFLOW_ROUTES_URL}/{test_workflow['id']}",
            json=update_data,
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["isActive"] == False

    def test_update_nonexistent_workflow(self, authenticated_user):
        headers = {"Authorization": f"Bearer {authenticated_user['token']}"}
        update_data = {"name": "Test"}
        response = requests.patch(f"{WORKFLOW_ROUTES_URL}/999999", json=update_data, headers=headers)
        assert response.status_code == 404

    def test_toggle_workflow_active(self, authenticated_user, test_workflow):
        headers = {"Authorization": f"Bearer {authenticated_user['token']}"}
        initial_state = test_workflow["isActive"]
        response = requests.patch(f"{WORKFLOW_ROUTES_URL}/{test_workflow['id']}/toggle", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["isActive"] == (not initial_state)
        response2 = requests.patch(f"{WORKFLOW_ROUTES_URL}/{test_workflow['id']}/toggle", headers=headers)
        assert response2.status_code == 200
        data2 = response2.json()
        assert data2["isActive"] == initial_state

    def test_toggle_workflow_no_auth(self, test_workflow):
        response = requests.patch(f"{WORKFLOW_ROUTES_URL}/{test_workflow['id']}/toggle")
        assert response.status_code == 401

    def test_toggle_workflow_wrong_user(self, authenticated_user2, test_workflow):
        headers = {"Authorization": f"Bearer {authenticated_user2['token']}"}
        response = requests.patch(f"{WORKFLOW_ROUTES_URL}/{test_workflow['id']}/toggle", headers=headers)
        assert response.status_code == 403

    def test_delete_workflow(self, authenticated_user):
        headers = {"Authorization": f"Bearer {authenticated_user['token']}"}
        workflow_data = {
            "name": "To Delete"
        }
        create_response = requests.post(WORKFLOW_ROUTES_URL, json=workflow_data, headers=headers)
        workflow_id = create_response.json()["id"]
        delete_response = requests.delete(f"{WORKFLOW_ROUTES_URL}/{workflow_id}", headers=headers)
        assert delete_response.status_code == 204
        get_response = requests.get(f"{WORKFLOW_ROUTES_URL}/{workflow_id}", headers=headers)
        assert get_response.status_code == 404

    def test_delete_workflow_no_auth(self, test_workflow):
        response = requests.delete(f"{WORKFLOW_ROUTES_URL}/{test_workflow['id']}")
        assert response.status_code == 401

    def test_delete_workflow_wrong_user(self, authenticated_user2, test_workflow):
        headers = {"Authorization": f"Bearer {authenticated_user2['token']}"}
        response = requests.delete(f"{WORKFLOW_ROUTES_URL}/{test_workflow['id']}", headers=headers)
        assert response.status_code == 403

    def test_delete_nonexistent_workflow(self, authenticated_user):
        headers = {"Authorization": f"Bearer {authenticated_user['token']}"}
        response = requests.delete(f"{WORKFLOW_ROUTES_URL}/999999", headers=headers)
        assert response.status_code == 404

class TestWorkflowFull:
    def test_full_workflow_lifecycle(self, authenticated_user):
        headers = {"Authorization": f"Bearer {authenticated_user['token']}"}
        create_data = {
            "name": "Full Lifecycle Workflow",
            "description": "Testing full CRUD",
            "isActive": True
        }
        create_response = requests.post(WORKFLOW_ROUTES_URL, json=create_data, headers=headers)
        assert create_response.status_code == 201
        workflow = create_response.json()
        workflow_id = workflow["id"]
        get_response = requests.get(f"{WORKFLOW_ROUTES_URL}/{workflow_id}", headers=headers)
        assert get_response.status_code == 200
        assert get_response.json()["name"] == "Full Lifecycle Workflow"
        update_response = requests.patch(
            f"{WORKFLOW_ROUTES_URL}/{workflow_id}",
            json={"name": "Updated Lifecycle", "isActive": False},
            headers=headers
        )
        assert update_response.status_code == 200
        assert update_response.json()["name"] == "Updated Lifecycle"
        assert update_response.json()["isActive"] == False
        toggle_response = requests.patch(f"{WORKFLOW_ROUTES_URL}/{workflow_id}/toggle", headers=headers)
        assert toggle_response.status_code == 200
        assert toggle_response.json()["isActive"] == True
        delete_response = requests.delete(f"{WORKFLOW_ROUTES_URL}/{workflow_id}", headers=headers)
        assert delete_response.status_code == 204
        final_get = requests.get(f"{WORKFLOW_ROUTES_URL}/{workflow_id}", headers=headers)
        assert final_get.status_code == 404

    def test_multiple_workflows_same_user(self, authenticated_user):
        headers = {"Authorization": f"Bearer {authenticated_user['token']}"}
        workflow_ids = []
        for i in range(3):
            workflow_data = {
                "name": f"Workflow {i+1}"
            }
            response = requests.post(WORKFLOW_ROUTES_URL, json=workflow_data, headers=headers)
            assert response.status_code == 201
            workflow_ids.append(response.json()["id"])
        list_response = requests.get(WORKFLOW_ROUTES_URL, headers=headers)
        assert list_response.status_code == 200
        data = list_response.json()
        assert len(data) >= 3
        for workflow_id in workflow_ids:
            requests.delete(f"{WORKFLOW_ROUTES_URL}/{workflow_id}", headers=headers)
