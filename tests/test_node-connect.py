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

def get_connection_url(workflow_id):
    return f"{WORKFLOW_ROUTES_URL}/{workflow_id}/connection"

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
def test_nodes(authenticated_user, test_workflow):
    headers = {"Authorization": f"Bearer {authenticated_user['token']}"}
    node1_data = {
        "name": "Source Node",
        "actionId": None,
        "reactionId": None,
        "logicType": "IF",
        "conf": {"condition": "x > 5"},
        "isTriggered": False,
        "positionX": 100.0,
        "positionY": 200.0
    }
    node2_data = {
        "name": "Target Node",
        "logicType": "IF",
        "actionId": None,
        "reactionId": None,
        "conf": {"condition": "y < 10"},
        "isTriggered": False,
        "positionX": 300.0,
        "positionY": 200.0
    }

    response1 = requests.post(
        get_node_url(test_workflow['id']),
        json=node1_data,
        headers=headers
    )
    assert response1.status_code == 201
    node1 = response1.json()

    response2 = requests.post(
        get_node_url(test_workflow['id']),
        json=node2_data,
        headers=headers
    )
    assert response2.status_code == 201
    node2 = response2.json()

    yield {"node1": node1, "node2": node2}

    try:
        requests.delete(f"{get_node_url(test_workflow['id'])}/{node1['id']}", headers=headers)
        requests.delete(f"{get_node_url(test_workflow['id'])}/{node2['id']}", headers=headers)
    except:
        pass

@pytest.fixture
def test_connection(authenticated_user, test_workflow, test_nodes):
    headers = {"Authorization": f"Bearer {authenticated_user['token']}"}
    connection_data = {
        "sourceNodeId": test_nodes["node1"]["id"],
        "targetNodeId": test_nodes["node2"]["id"]
    }
    response = requests.post(
        get_connection_url(test_workflow['id']),
        json=connection_data,
        headers=headers
    )
    assert response.status_code == 201, f"Connection creation failed: {response.status_code} - {response.text}"
    connection = response.json()
    yield connection
    try:
        requests.delete(
            f"{get_connection_url(test_workflow['id'])}/{connection['id']}",
            headers=headers
        )
    except:
        pass


class TestNodeConnectionCRUD:
    def test_create_connection(self, authenticated_user, test_workflow, test_nodes):
        headers = {"Authorization": f"Bearer {authenticated_user['token']}"}
        connection_data = {
            "sourceNodeId": test_nodes["node1"]["id"],
            "targetNodeId": test_nodes["node2"]["id"]
        }
        response = requests.post(
            get_connection_url(test_workflow['id']),
            json=connection_data,
            headers=headers
        )
        assert response.status_code == 201
        data = response.json()
        assert "id" in data
        assert data["sourceNodeId"] == test_nodes["node1"]["id"]
        assert data["targetNodeId"] == test_nodes["node2"]["id"]
        assert data["workflowId"] == test_workflow["id"]
        requests.delete(f"{get_connection_url(test_workflow['id'])}/{data['id']}", headers=headers)

    def test_create_connection_minimal(self, authenticated_user, test_workflow, test_nodes):
        headers = {"Authorization": f"Bearer {authenticated_user['token']}"}
        connection_data = {
            "sourceNodeId": test_nodes["node1"]["id"],
            "targetNodeId": test_nodes["node2"]["id"]
        }
        response = requests.post(
            get_connection_url(test_workflow['id']),
            json=connection_data,
            headers=headers
        )
        assert response.status_code == 201
        data = response.json()
        assert data["sourceNodeId"] == test_nodes["node1"]["id"]
        assert data["targetNodeId"] == test_nodes["node2"]["id"]
        requests.delete(f"{get_connection_url(test_workflow['id'])}/{data['id']}", headers=headers)

    def test_create_connection_no_auth(self, test_workflow, test_nodes):
        connection_data = {
            "sourceNodeId": test_nodes["node1"]["id"],
            "targetNodeId": test_nodes["node2"]["id"]
        }
        response = requests.post(
            get_connection_url(test_workflow['id']),
            json=connection_data
        )
        assert response.status_code == 401

    def test_create_connection_nonexistent_workflow(self, authenticated_user, test_nodes):
        headers = {"Authorization": f"Bearer {authenticated_user['token']}"}
        connection_data = {
            "sourceNodeId": test_nodes["node1"]["id"],
            "targetNodeId": test_nodes["node2"]["id"]
        }
        response = requests.post(
            get_connection_url(999999),
            json=connection_data,
            headers=headers
        )
        assert response.status_code == 404

    def test_create_connection_wrong_user_workflow(self, authenticated_user2, test_workflow, test_nodes):
        headers = {"Authorization": f"Bearer {authenticated_user2['token']}"}
        connection_data = {
            "sourceNodeId": test_nodes["node1"]["id"],
            "targetNodeId": test_nodes["node2"]["id"]
        }
        response = requests.post(
            get_connection_url(test_workflow['id']),
            json=connection_data,
            headers=headers
        )
        assert response.status_code == 403

    def test_create_connection_invalid_source_node(self, authenticated_user, test_workflow, test_nodes):
        headers = {"Authorization": f"Bearer {authenticated_user['token']}"}
        connection_data = {
            "sourceNodeId": 999999,
            "targetNodeId": test_nodes["node2"]["id"]
        }
        response = requests.post(
            get_connection_url(test_workflow['id']),
            json=connection_data,
            headers=headers
        )
        assert response.status_code == 404

    def test_create_connection_invalid_target_node(self, authenticated_user, test_workflow, test_nodes):
        headers = {"Authorization": f"Bearer {authenticated_user['token']}"}
        connection_data = {
            "sourceNodeId": test_nodes["node1"]["id"],
            "targetNodeId": 999999
        }
        response = requests.post(
            get_connection_url(test_workflow['id']),
            json=connection_data,
            headers=headers
        )
        assert response.status_code == 404

    def test_get_all_connections(self, authenticated_user, test_workflow, test_connection):
        headers = {"Authorization": f"Bearer {authenticated_user['token']}"}
        response = requests.get(get_connection_url(test_workflow['id']), headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        connection_ids = [c["id"] for c in data]
        assert test_connection["id"] in connection_ids

    def test_get_all_connections_no_auth(self, test_workflow):
        response = requests.get(get_connection_url(test_workflow['id']))
        assert response.status_code == 401

    def test_get_all_connections_wrong_user(self, authenticated_user2, test_workflow):
        headers = {"Authorization": f"Bearer {authenticated_user2['token']}"}
        response = requests.get(get_connection_url(test_workflow['id']), headers=headers)
        assert response.status_code == 403

    def test_get_all_connections_nonexistent_workflow(self, authenticated_user):
        headers = {"Authorization": f"Bearer {authenticated_user['token']}"}
        response = requests.get(get_connection_url(999999), headers=headers)
        assert response.status_code == 404

    def test_get_one_connection(self, authenticated_user, test_workflow, test_connection):
        headers = {"Authorization": f"Bearer {authenticated_user['token']}"}
        response = requests.get(
            f"{get_connection_url(test_workflow['id'])}/{test_connection['id']}",
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_connection["id"]
        assert data["sourceNodeId"] == test_connection["sourceNodeId"]
        assert data["targetNodeId"] == test_connection["targetNodeId"]

    def test_get_one_connection_no_auth(self, test_workflow, test_connection):
        response = requests.get(
            f"{get_connection_url(test_workflow['id'])}/{test_connection['id']}"
        )
        assert response.status_code == 401

    def test_get_one_connection_wrong_user(self, authenticated_user2, test_workflow, test_connection):
        headers = {"Authorization": f"Bearer {authenticated_user2['token']}"}
        response = requests.get(
            f"{get_connection_url(test_workflow['id'])}/{test_connection['id']}",
            headers=headers
        )
        assert response.status_code == 403

    def test_get_connection_nonexistent(self, authenticated_user, test_workflow):
        headers = {"Authorization": f"Bearer {authenticated_user['token']}"}
        response = requests.get(
            f"{get_connection_url(test_workflow['id'])}/999999",
            headers=headers
        )
        assert response.status_code == 404

    def test_get_connection_wrong_workflow(self, authenticated_user, test_workflow, test_connection):
        headers = {"Authorization": f"Bearer {authenticated_user['token']}"}
        workflow_data = {"name": "Other Workflow"}
        other_workflow = requests.post(
            WORKFLOW_ROUTES_URL,
            json=workflow_data,
            headers=headers
        ).json()
        response = requests.get(
            f"{get_connection_url(other_workflow['id'])}/{test_connection['id']}",
            headers=headers
        )
        assert response.status_code == 404
        requests.delete(f"{WORKFLOW_ROUTES_URL}/{other_workflow['id']}", headers=headers)

    def test_update_connection(self, authenticated_user, test_workflow, test_connection):
        headers = {"Authorization": f"Bearer {authenticated_user['token']}"}
        # Create a third node to change the target
        node3_data = {
            "name": "Third Node",
            "logicType": "IF",
            "positionX": 500.0,
            "positionY": 200.0
        }
        node3_response = requests.post(
            get_node_url(test_workflow['id']),
            json=node3_data,
            headers=headers
        )
        node3 = node3_response.json()

        update_data = {
            "targetNodeId": node3["id"]
        }
        response = requests.patch(
            f"{get_connection_url(test_workflow['id'])}/{test_connection['id']}",
            json=update_data,
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_connection["id"]
        assert data["targetNodeId"] == node3["id"]

        requests.delete(f"{get_node_url(test_workflow['id'])}/{node3['id']}", headers=headers)

    def test_update_connection_no_auth(self, test_workflow, test_connection):
        update_data = {"targetNodeId": 999}
        response = requests.patch(
            f"{get_connection_url(test_workflow['id'])}/{test_connection['id']}",
            json=update_data
        )
        assert response.status_code == 401

    def test_update_connection_wrong_user(self, authenticated_user2, test_workflow, test_connection):
        headers = {"Authorization": f"Bearer {authenticated_user2['token']}"}
        update_data = {"targetNodeId": 999}
        response = requests.patch(
            f"{get_connection_url(test_workflow['id'])}/{test_connection['id']}",
            json=update_data,
            headers=headers
        )
        assert response.status_code == 403

    def test_update_connection_change_target_node(self, authenticated_user, test_workflow, test_connection, test_nodes):
        headers = {"Authorization": f"Bearer {authenticated_user['token']}"}
        node3_data = {
            "name": "Third Node",
            "logicType": "IF",
            "positionX": 500.0,
            "positionY": 200.0
        }
        node3_response = requests.post(
            get_node_url(test_workflow['id']),
            json=node3_data,
            headers=headers
        )
        node3 = node3_response.json()

        update_data = {"targetNodeId": node3["id"]}
        response = requests.patch(
            f"{get_connection_url(test_workflow['id'])}/{test_connection['id']}",
            json=update_data,
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["targetNodeId"] == node3["id"]

        requests.delete(f"{get_node_url(test_workflow['id'])}/{node3['id']}", headers=headers)

    def test_update_nonexistent_connection(self, authenticated_user, test_workflow):
        headers = {"Authorization": f"Bearer {authenticated_user['token']}"}
        update_data = {"targetNodeId": 1}
        response = requests.patch(
            f"{get_connection_url(test_workflow['id'])}/999999",
            json=update_data,
            headers=headers
        )
        assert response.status_code == 404

    def test_delete_connection(self, authenticated_user, test_workflow, test_nodes):
        headers = {"Authorization": f"Bearer {authenticated_user['token']}"}
        connection_data = {
            "sourceNodeId": test_nodes["node1"]["id"],
            "targetNodeId": test_nodes["node2"]["id"]
        }
        create_response = requests.post(
            get_connection_url(test_workflow['id']),
            json=connection_data,
            headers=headers
        )
        connection_id = create_response.json()["id"]

        delete_response = requests.delete(
            f"{get_connection_url(test_workflow['id'])}/{connection_id}",
            headers=headers
        )
        assert delete_response.status_code == 204

        get_response = requests.get(
            f"{get_connection_url(test_workflow['id'])}/{connection_id}",
            headers=headers
        )
        assert get_response.status_code == 404

    def test_delete_connection_no_auth(self, test_workflow, test_connection):
        response = requests.delete(
            f"{get_connection_url(test_workflow['id'])}/{test_connection['id']}"
        )
        assert response.status_code == 401

    def test_delete_connection_wrong_user(self, authenticated_user2, test_workflow, test_connection):
        headers = {"Authorization": f"Bearer {authenticated_user2['token']}"}
        response = requests.delete(
            f"{get_connection_url(test_workflow['id'])}/{test_connection['id']}",
            headers=headers
        )
        assert response.status_code == 403

    def test_delete_nonexistent_connection(self, authenticated_user, test_workflow):
        headers = {"Authorization": f"Bearer {authenticated_user['token']}"}
        response = requests.delete(
            f"{get_connection_url(test_workflow['id'])}/999999",
            headers=headers
        )
        assert response.status_code == 404


class TestNodeConnectionFull:
    def test_full_connection_lifecycle(self, authenticated_user, test_workflow, test_nodes):
        headers = {"Authorization": f"Bearer {authenticated_user['token']}"}

        # Create
        create_data = {
            "sourceNodeId": test_nodes["node1"]["id"],
            "targetNodeId": test_nodes["node2"]["id"]
        }
        create_response = requests.post(
            get_connection_url(test_workflow['id']),
            json=create_data,
            headers=headers
        )
        assert create_response.status_code == 201
        connection = create_response.json()
        connection_id = connection["id"]

        # Get
        get_response = requests.get(
            f"{get_connection_url(test_workflow['id'])}/{connection_id}",
            headers=headers
        )
        assert get_response.status_code == 200
        assert get_response.json()["sourceNodeId"] == test_nodes["node1"]["id"]

        # Update - Create a new node to update the target
        node3_data = {
            "name": "Third Node",
            "logicType": "IF",
            "positionX": 500.0,
            "positionY": 200.0
        }
        node3 = requests.post(
            get_node_url(test_workflow['id']),
            json=node3_data,
            headers=headers
        ).json()

        update_response = requests.patch(
            f"{get_connection_url(test_workflow['id'])}/{connection_id}",
            json={"targetNodeId": node3["id"]},
            headers=headers
        )
        assert update_response.status_code == 200
        assert update_response.json()["targetNodeId"] == node3["id"]

        # Delete
        delete_response = requests.delete(
            f"{get_connection_url(test_workflow['id'])}/{connection_id}",
            headers=headers
        )
        assert delete_response.status_code == 204

        # Verify deletion
        final_get = requests.get(
            f"{get_connection_url(test_workflow['id'])}/{connection_id}",
            headers=headers
        )
        assert final_get.status_code == 404

        # Cleanup
        requests.delete(f"{get_node_url(test_workflow['id'])}/{node3['id']}", headers=headers)

    def test_multiple_connections_same_workflow(self, authenticated_user, test_workflow):
        headers = {"Authorization": f"Bearer {authenticated_user['token']}"}

        # Create multiple nodes
        nodes = []
        for i in range(4):
            node_data = {
                "name": f"Node {i+1}",
                "logicType": "IF",
                "positionX": float(i * 100),
                "positionY": 200.0
            }
            response = requests.post(
                get_node_url(test_workflow['id']),
                json=node_data,
                headers=headers
            )
            nodes.append(response.json())

        # Create connections
        connection_ids = []
        for i in range(3):
            connection_data = {
                "sourceNodeId": nodes[i]["id"],
                "targetNodeId": nodes[i+1]["id"]
            }
            response = requests.post(
                get_connection_url(test_workflow['id']),
                json=connection_data,
                headers=headers
            )
            assert response.status_code == 201
            connection_ids.append(response.json()["id"])

        # Verify all connections exist
        list_response = requests.get(
            get_connection_url(test_workflow['id']),
            headers=headers
        )
        assert list_response.status_code == 200
        data = list_response.json()
        assert len(data) >= 3

        # Cleanup
        for connection_id in connection_ids:
            requests.delete(
                f"{get_connection_url(test_workflow['id'])}/{connection_id}",
                headers=headers
            )
        for node in nodes:
            requests.delete(
                f"{get_node_url(test_workflow['id'])}/{node['id']}",
                headers=headers
            )

    def test_connection_workflow_isolation(self, authenticated_user):
        headers = {"Authorization": f"Bearer {authenticated_user['token']}"}

        # Create two workflows
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

        # Create nodes in each workflow
        node1_w1 = requests.post(
            get_node_url(workflow1['id']),
            json={"name": "Node 1 W1", "logicType": "IF"},
            headers=headers
        ).json()
        node2_w1 = requests.post(
            get_node_url(workflow1['id']),
            json={"name": "Node 2 W1", "logicType": "IF"},
            headers=headers
        ).json()

        node1_w2 = requests.post(
            get_node_url(workflow2['id']),
            json={"name": "Node 1 W2", "logicType": "IF"},
            headers=headers
        ).json()
        node2_w2 = requests.post(
            get_node_url(workflow2['id']),
            json={"name": "Node 2 W2", "logicType": "IF"},
            headers=headers
        ).json()

        # Create connections in each workflow
        conn1 = requests.post(
            get_connection_url(workflow1['id']),
            json={"sourceNodeId": node1_w1["id"], "targetNodeId": node2_w1["id"]},
            headers=headers
        ).json()

        conn2 = requests.post(
            get_connection_url(workflow2['id']),
            json={"sourceNodeId": node1_w2["id"], "targetNodeId": node2_w2["id"]},
            headers=headers
        ).json()

        # Verify isolation
        connections_w1 = requests.get(
            get_connection_url(workflow1['id']),
            headers=headers
        ).json()
        connection_ids_w1 = [c["id"] for c in connections_w1]
        assert conn1["id"] in connection_ids_w1
        assert conn2["id"] not in connection_ids_w1

        # Cleanup
        requests.delete(f"{WORKFLOW_ROUTES_URL}/{workflow1['id']}", headers=headers)
        requests.delete(f"{WORKFLOW_ROUTES_URL}/{workflow2['id']}", headers=headers)

    def test_cascade_delete_connections_with_workflow(self, authenticated_user):
        headers = {"Authorization": f"Bearer {authenticated_user['token']}"}

        # Create workflow
        workflow = requests.post(
            WORKFLOW_ROUTES_URL,
            json={"name": "Cascade Test Workflow"},
            headers=headers
        ).json()

        # Create nodes
        node1 = requests.post(
            get_node_url(workflow['id']),
            json={"name": "Node 1", "logicType": "IF"},
            headers=headers
        ).json()
        node2 = requests.post(
            get_node_url(workflow['id']),
            json={"name": "Node 2", "logicType": "IF"},
            headers=headers
        ).json()

        # Create connection
        connection = requests.post(
            get_connection_url(workflow['id']),
            json={"sourceNodeId": node1["id"], "targetNodeId": node2["id"]},
            headers=headers
        ).json()

        # Delete workflow (should cascade)
        requests.delete(f"{WORKFLOW_ROUTES_URL}/{workflow['id']}", headers=headers)

        # Verify connection no longer exists
        response = requests.get(
            f"{get_connection_url(workflow['id'])}/{connection['id']}",
            headers=headers
        )
        assert response.status_code == 404

    def test_cascade_delete_connections_with_node(self, authenticated_user, test_workflow):
        headers = {"Authorization": f"Bearer {authenticated_user['token']}"}

        # Create nodes
        node1 = requests.post(
            get_node_url(test_workflow['id']),
            json={"name": "Source Node", "logicType": "IF"},
            headers=headers
        ).json()
        node2 = requests.post(
            get_node_url(test_workflow['id']),
            json={"name": "Target Node", "logicType": "IF"},
            headers=headers
        ).json()

        # Create connection
        connection = requests.post(
            get_connection_url(test_workflow['id']),
            json={"sourceNodeId": node1["id"], "targetNodeId": node2["id"]},
            headers=headers
        ).json()

        # Delete source node
        requests.delete(
            f"{get_node_url(test_workflow['id'])}/{node1['id']}",
            headers=headers
        )

        # Verify connection no longer exists
        response = requests.get(
            f"{get_connection_url(test_workflow['id'])}/{connection['id']}",
            headers=headers
        )
        assert response.status_code == 404

        # Cleanup
        requests.delete(
            f"{get_node_url(test_workflow['id'])}/{node2['id']}",
            headers=headers
        )
