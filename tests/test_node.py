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

def get_node_url(workflow_id):
    return f"{WORKFLOW_ROUTES_URL}/{workflow_id}/node"

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

@pytest.fixture
def test_node_data():
    return {
        "name": "Test Node",
        "actionId": None,
        "reactionId": None,
        "logicType": "IF",
        "conf": {"condition": "test"},
        "isTriggered": False,
        "positionX": 100.0,
        "positionY": 200.0
    }

@pytest.fixture
def test_node(authenticated_user, test_workflow):
    headers = {"Authorization": f"Bearer {authenticated_user['token']}"}
    node_data = {
        "name": "Test Node",
        "logicType": "IF",
        "conf": {"condition": "x > 5"},
        "isTriggered": False,
        "positionX": 150.0,
        "positionY": 250.0
    }
    response = requests.post(
        get_node_url(test_workflow['id']),
        json=node_data,
        headers=headers
    )
    assert response.status_code == 201, f"Node creation failed: {response.status_code} - {response.text}"
    node = response.json()
    yield node
    try:
        requests.delete(
            f"{get_node_url(test_workflow['id'])}/{node['id']}",
            headers=headers
        )
    except:
        pass

class TestNodeCRUD:
    def test_create_node_with_logic_type(self, authenticated_user, test_workflow):
        headers = {"Authorization": f"Bearer {authenticated_user['token']}"}
        node_data = {
            "name": "Logic Node",
            "logicType": "IF",
            "conf": {"condition": "x > 10"},
            "isTriggered": False,
            "positionX": 100.0,
            "positionY": 200.0
        }
        response = requests.post(
            get_node_url(test_workflow['id']),
            json=node_data,
            headers=headers
        )
        assert response.status_code == 201
        data = response.json()
        assert "id" in data
        assert data["name"] == "Logic Node"
        assert data["logicType"] == "IF"
        assert data["workflowId"] == test_workflow["id"]
        assert data["isTriggered"] == False
        assert data["positionX"] == 100.0
        assert data["positionY"] == 200.0
        assert "workflow" in data
        requests.delete(f"{get_node_url(test_workflow['id'])}/{data['id']}", headers=headers)

    # def test_create_node_with_action_id(self, authenticated_user, test_workflow):
    #     headers = {"Authorization": f"Bearer {authenticated_user['token']}"}
    #     node_data = {
    #         "name": "Action Node",
    #         "actionId": 1,
    #         "conf": {"param": "value"},
    #         "positionX": 50.0,
    #         "positionY": 100.0
    #     }
    #     response = requests.post(
    #         get_node_url(test_workflow['id']),
    #         json=node_data,
    #         headers=headers
    #     )
    #     assert response.status_code == 201
    #     data = response.json()
    #     assert data["actionId"] == 1
    #     assert data["reactionId"] is None
    #     assert data["logicType"] is None
    #     requests.delete(f"{get_node_url(test_workflow['id'])}/{data['id']}", headers=headers)

    # def test_create_node_with_reaction_id(self, authenticated_user, test_workflow):
    #     headers = {"Authorization": f"Bearer {authenticated_user['token']}"}
    #     node_data = {
    #         "name": "Reaction Node",
    #         "reactionId": 1,
    #         "conf": {"output": "message"},
    #         "positionX": 300.0,
    #         "positionY": 150.0
    #     }
    #     response = requests.post(
    #         get_node_url(test_workflow['id']),
    #         json=node_data,
    #         headers=headers
    #     )
    #     assert response.status_code == 201
    #     data = response.json()
    #     assert data["reactionId"] == 1
    #     assert data["actionId"] is None
    #     requests.delete(f"{get_node_url(test_workflow['id'])}/{data['id']}", headers=headers)

    def test_create_node_no_type_fails(self, authenticated_user, test_workflow):
        headers = {"Authorization": f"Bearer {authenticated_user['token']}"}
        node_data = {
            "name": "Invalid Node",
            "conf": {"test": "value"}
        }
        response = requests.post(
            get_node_url(test_workflow['id']),
            json=node_data,
            headers=headers
        )
        assert response.status_code == 400

    def test_create_node_no_auth(self, test_workflow):
        node_data = {
            "name": "Unauthorized Node",
            "logicType": "IF"
        }
        response = requests.post(
            get_node_url(test_workflow['id']),
            json=node_data
        )
        assert response.status_code == 401

    def test_create_node_minimal(self, authenticated_user, test_workflow):
        headers = {"Authorization": f"Bearer {authenticated_user['token']}"}
        node_data = {
            "logicType": "IF"
        }
        response = requests.post(
            get_node_url(test_workflow['id']),
            json=node_data,
            headers=headers
        )
        assert response.status_code == 201
        data = response.json()
        assert data["logicType"] == "IF"
        assert data["isTriggered"] == False
        assert data["name"] is None
        requests.delete(f"{get_node_url(test_workflow['id'])}/{data['id']}", headers=headers)

    def test_create_node_nonexistent_workflow(self, authenticated_user):
        headers = {"Authorization": f"Bearer {authenticated_user['token']}"}
        node_data = {
            "name": "Orphan Node",
            "logicType": "IF"
        }
        response = requests.post(
            get_node_url(999999),
            json=node_data,
            headers=headers
        )
        assert response.status_code == 404

    def test_create_node_wrong_user_workflow(self, authenticated_user2, test_workflow):
        headers = {"Authorization": f"Bearer {authenticated_user2['token']}"}
        node_data = {
            "name": "Hacker Node",
            "logicType": "IF"
        }
        response = requests.post(
            get_node_url(test_workflow['id']),
            json=node_data,
            headers=headers
        )
        assert response.status_code == 403

    def test_get_all_nodes(self, authenticated_user, test_workflow, test_node):
        headers = {"Authorization": f"Bearer {authenticated_user['token']}"}
        response = requests.get(get_node_url(test_workflow['id']), headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        node_ids = [n["id"] for n in data]
        assert test_node["id"] in node_ids

    def test_get_all_nodes_no_auth(self, test_workflow):
        response = requests.get(get_node_url(test_workflow['id']))
        assert response.status_code == 401

    def test_get_all_nodes_wrong_user(self, authenticated_user2, test_workflow):
        headers = {"Authorization": f"Bearer {authenticated_user2['token']}"}
        response = requests.get(get_node_url(test_workflow['id']), headers=headers)
        assert response.status_code == 403

    def test_get_all_nodes_nonexistent_workflow(self, authenticated_user):
        headers = {"Authorization": f"Bearer {authenticated_user['token']}"}
        response = requests.get(get_node_url(999999), headers=headers)
        assert response.status_code == 404

    def test_get_one_node(self, authenticated_user, test_workflow, test_node):
        headers = {"Authorization": f"Bearer {authenticated_user['token']}"}
        response = requests.get(
            f"{get_node_url(test_workflow['id'])}/{test_node['id']}",
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_node["id"]
        assert data["name"] == test_node["name"]
        assert "workflow" in data
        assert "action" in data
        assert "reaction" in data
        assert "outConnect" in data
        assert "inConnect" in data
        assert "executions" in data

    def test_get_one_node_no_auth(self, test_workflow, test_node):
        response = requests.get(
            f"{get_node_url(test_workflow['id'])}/{test_node['id']}"
        )
        assert response.status_code == 401

    def test_get_one_node_wrong_user(self, authenticated_user2, test_workflow, test_node):
        headers = {"Authorization": f"Bearer {authenticated_user2['token']}"}
        response = requests.get(
            f"{get_node_url(test_workflow['id'])}/{test_node['id']}",
            headers=headers
        )
        assert response.status_code == 403

    def test_get_node_nonexistent(self, authenticated_user, test_workflow):
        headers = {"Authorization": f"Bearer {authenticated_user['token']}"}
        response = requests.get(
            f"{get_node_url(test_workflow['id'])}/999999",
            headers=headers
        )
        assert response.status_code == 404

    def test_get_node_wrong_workflow(self, authenticated_user, test_workflow, test_node):
        headers = {"Authorization": f"Bearer {authenticated_user['token']}"}
        workflow_data = {"name": "Other Workflow"}
        other_workflow = requests.post(
            WORKFLOW_ROUTES_URL,
            json=workflow_data,
            headers=headers
        ).json()
        response = requests.get(
            f"{get_node_url(other_workflow['id'])}/{test_node['id']}",
            headers=headers
        )
        assert response.status_code == 404
        requests.delete(f"{WORKFLOW_ROUTES_URL}/{other_workflow['id']}", headers=headers)

    def test_update_node(self, authenticated_user, test_workflow, test_node):
        headers = {"Authorization": f"Bearer {authenticated_user['token']}"}
        update_data = {
            "name": "Updated Node Name",
            "conf": {"condition": "x > 20"},
            "positionX": 500.0,
            "positionY": 600.0
        }
        response = requests.patch(
            f"{get_node_url(test_workflow['id'])}/{test_node['id']}",
            json=update_data,
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_node["id"]
        assert data["name"] == "Updated Node Name"
        assert data["conf"]["condition"] == "x > 20"
        assert data["positionX"] == 500.0
        assert data["positionY"] == 600.0

    def test_update_node_no_auth(self, test_workflow, test_node):
        update_data = {"name": "Hacked"}
        response = requests.patch(
            f"{get_node_url(test_workflow['id'])}/{test_node['id']}",
            json=update_data
        )
        assert response.status_code == 401

    def test_update_node_wrong_user(self, authenticated_user2, test_workflow, test_node):
        headers = {"Authorization": f"Bearer {authenticated_user2['token']}"}
        update_data = {"name": "Hacked Node"}
        response = requests.patch(
            f"{get_node_url(test_workflow['id'])}/{test_node['id']}",
            json=update_data,
            headers=headers
        )
        assert response.status_code == 403

    def test_update_node_change_logic_type(self, authenticated_user, test_workflow, test_node):
        headers = {"Authorization": f"Bearer {authenticated_user['token']}"}
        update_data = {"logicType": "IF"}
        response = requests.patch(
            f"{get_node_url(test_workflow['id'])}/{test_node['id']}",
            json=update_data,
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["logicType"] == "IF"

    def test_update_nonexistent_node(self, authenticated_user, test_workflow):
        headers = {"Authorization": f"Bearer {authenticated_user['token']}"}
        update_data = {"name": "Test"}
        response = requests.patch(
            f"{get_node_url(test_workflow['id'])}/999999",
            json=update_data,
            headers=headers
        )
        assert response.status_code == 404

    def test_toggle_node_trigger(self, authenticated_user, test_workflow, test_node):
        headers = {"Authorization": f"Bearer {authenticated_user['token']}"}
        initial_state = test_node["isTriggered"]
        response = requests.patch(
            f"{get_node_url(test_workflow['id'])}/{test_node['id']}/toggle",
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["isTriggered"] == (not initial_state)
        response2 = requests.patch(
            f"{get_node_url(test_workflow['id'])}/{test_node['id']}/toggle",
            headers=headers
        )
        assert response2.status_code == 200
        data2 = response2.json()
        assert data2["isTriggered"] == initial_state

    def test_toggle_node_no_auth(self, test_workflow, test_node):
        response = requests.patch(
            f"{get_node_url(test_workflow['id'])}/{test_node['id']}/toggle"
        )
        assert response.status_code == 401

    def test_toggle_node_wrong_user(self, authenticated_user2, test_workflow, test_node):
        headers = {"Authorization": f"Bearer {authenticated_user2['token']}"}
        response = requests.patch(
            f"{get_node_url(test_workflow['id'])}/{test_node['id']}/toggle",
            headers=headers
        )
        assert response.status_code == 403

    def test_delete_node(self, authenticated_user, test_workflow):
        headers = {"Authorization": f"Bearer {authenticated_user['token']}"}
        node_data = {
            "name": "To Delete",
            "logicType": "IF"
        }
        create_response = requests.post(
            get_node_url(test_workflow['id']),
            json=node_data,
            headers=headers
        )
        node_id = create_response.json()["id"]
        delete_response = requests.delete(
            f"{get_node_url(test_workflow['id'])}/{node_id}",
            headers=headers
        )
        assert delete_response.status_code == 204
        get_response = requests.get(
            f"{get_node_url(test_workflow['id'])}/{node_id}",
            headers=headers
        )
        assert get_response.status_code == 404

    def test_delete_node_no_auth(self, test_workflow, test_node):
        response = requests.delete(
            f"{get_node_url(test_workflow['id'])}/{test_node['id']}"
        )
        assert response.status_code == 401

    def test_delete_node_wrong_user(self, authenticated_user2, test_workflow, test_node):
        headers = {"Authorization": f"Bearer {authenticated_user2['token']}"}
        response = requests.delete(
            f"{get_node_url(test_workflow['id'])}/{test_node['id']}",
            headers=headers
        )
        assert response.status_code == 403

    def test_delete_nonexistent_node(self, authenticated_user, test_workflow):
        headers = {"Authorization": f"Bearer {authenticated_user['token']}"}
        response = requests.delete(
            f"{get_node_url(test_workflow['id'])}/999999",
            headers=headers
        )
        assert response.status_code == 404

class TestNodeFull:
    def test_full_node_lifecycle(self, authenticated_user, test_workflow):
        headers = {"Authorization": f"Bearer {authenticated_user['token']}"}
        create_data = {
            "name": "Full Lifecycle Node",
            "logicType": "IF",
            "conf": {"condition": "x > 0"},
            "isTriggered": False,
            "positionX": 100.0,
            "positionY": 200.0
        }
        create_response = requests.post(
            get_node_url(test_workflow['id']),
            json=create_data,
            headers=headers
        )
        assert create_response.status_code == 201
        node = create_response.json()
        node_id = node["id"]
        get_response = requests.get(
            f"{get_node_url(test_workflow['id'])}/{node_id}",
            headers=headers
        )
        assert get_response.status_code == 200
        assert get_response.json()["name"] == "Full Lifecycle Node"
        update_response = requests.patch(
            f"{get_node_url(test_workflow['id'])}/{node_id}",
            json={"name": "Updated Lifecycle", "logicType": "IF"},
            headers=headers
        )
        assert update_response.status_code == 200
        assert update_response.json()["name"] == "Updated Lifecycle"
        assert update_response.json()["logicType"] == "IF"
        toggle_response = requests.patch(
            f"{get_node_url(test_workflow['id'])}/{node_id}/toggle",
            headers=headers
        )
        assert toggle_response.status_code == 200
        assert toggle_response.json()["isTriggered"] == True
        delete_response = requests.delete(
            f"{get_node_url(test_workflow['id'])}/{node_id}",
            headers=headers
        )
        assert delete_response.status_code == 204
        final_get = requests.get(
            f"{get_node_url(test_workflow['id'])}/{node_id}",
            headers=headers
        )
        assert final_get.status_code == 404

    def test_multiple_nodes_same_workflow(self, authenticated_user, test_workflow):
        headers = {"Authorization": f"Bearer {authenticated_user['token']}"}
        node_ids = []
        for i in range(3):
            node_data = {
                "name": f"Node {i+1}",
                "logicType": "IF",
                "positionX": float(i * 100),
                "positionY": float(i * 50)
            }
            response = requests.post(
                get_node_url(test_workflow['id']),
                json=node_data,
                headers=headers
            )
            assert response.status_code == 201
            node_ids.append(response.json()["id"])
        list_response = requests.get(
            get_node_url(test_workflow['id']),
            headers=headers
        )
        assert list_response.status_code == 200
        data = list_response.json()
        assert len(data) >= 3
        for node_id in node_ids:
            requests.delete(
                f"{get_node_url(test_workflow['id'])}/{node_id}",
                headers=headers
            )

    def test_node_workflow_isolation(self, authenticated_user):
        headers = {"Authorization": f"Bearer {authenticated_user['token']}"}
        workflow1 = requests.post(
            WORKFLOW_ROUTES_URL,
            json={"name": "Workflow 1"},
            headers=headers
        ).json()
        workflow2 = requests.post(
            WORKFLOW_ROUTES_URL,
            json={"name": "Workflow 2"},
            headers=headers
        ).json()
        node1 = requests.post(
            get_node_url(workflow1['id']),
            json={"name": "Node 1", "logicType": "IF"},
            headers=headers
        ).json()
        node2 = requests.post(
            get_node_url(workflow2['id']),
            json={"name": "Node 2", "logicType": "IF"},
            headers=headers
        ).json()
        nodes_workflow1 = requests.get(
            get_node_url(workflow1['id']),
            headers=headers
        ).json()
        node_ids_workflow1 = [n["id"] for n in nodes_workflow1]
        assert node1["id"] in node_ids_workflow1
        assert node2["id"] not in node_ids_workflow1
        requests.delete(f"{WORKFLOW_ROUTES_URL}/{workflow1['id']}", headers=headers)
        requests.delete(f"{WORKFLOW_ROUTES_URL}/{workflow2['id']}", headers=headers)

    def test_cascade_delete_nodes_with_workflow(self, authenticated_user):
        headers = {"Authorization": f"Bearer {authenticated_user['token']}"}
        workflow = requests.post(
            WORKFLOW_ROUTES_URL,
            json={"name": "Cascade Test Workflow"},
            headers=headers
        ).json()
        node = requests.post(
            get_node_url(workflow['id']),
            json={"name": "Node to Cascade", "logicType": "IF"},
            headers=headers
        ).json()
        requests.delete(f"{WORKFLOW_ROUTES_URL}/{workflow['id']}", headers=headers)
        response = requests.get(
            f"{get_node_url(workflow['id'])}/{node['id']}",
            headers=headers
        )
        assert response.status_code == 404
