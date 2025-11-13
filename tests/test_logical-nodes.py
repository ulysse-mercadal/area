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
def authenticated_user():
    user_data = {
        "email": generate_unique_email(),
        "password": "PasDInspiDeso",
        "name": "Michel",
        "surname": "MichelAussi"
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
        "name": "Test Logic Workflow",
        "description": "A test workflow for logic nodes",
        "isActive": True
    }
    response = requests.post(WORKFLOW_ROUTES_URL, json=workflow_data, headers=headers)
    assert response.status_code == 201, f"Workflow creation failed: {response.status_code} - {response.text}"
    workflow = response.json()
    yield {"workflow": workflow, "headers": headers}
    try:
        requests.delete(f"{WORKFLOW_ROUTES_URL}/{workflow['id']}", headers=headers)
    except:
        pass


class TestIfNode:
    def test_if_node_true_condition(self, test_workflow):
        """Test d'un n\u0153ud IF avec une condition vraie"""
        workflow = test_workflow["workflow"]
        headers = test_workflow["headers"]
        workflow_id = workflow["id"]
        if_node_data = {
            "name": "IF Node - True",
            "logicType": "IF",
            "conf": {
                "condition": "2 == 2"
            },
            "isTriggered": False,
            "positionX": 100.0,
            "positionY": 100.0
        }
        response = requests.post(
            get_node_url(workflow_id),
            json=if_node_data,
            headers=headers
        )
        assert response.status_code == 201, f"Node creation failed: {response.status_code} - {response.text}"
        if_node = response.json()
        execute_data = {
            "input": {"test": "data"}
        }
        exec_response = requests.post(
            f"{get_node_url(workflow_id)}/{if_node['id']}/execute",
            json=execute_data,
            headers=headers
        )
        assert exec_response.status_code in [200, 201], f"Execution failed: {exec_response.status_code} - {exec_response.text}"
        exec_data = exec_response.json()
        assert "nodeExecution" in exec_data
        assert exec_data["nodeExecution"]["executionChannel"] == "success"
        assert exec_data["nodeExecution"]["status"] == "SUCCESS"

    def test_if_node_false_condition(self, test_workflow):
        workflow = test_workflow["workflow"]
        headers = test_workflow["headers"]
        workflow_id = workflow["id"]
        if_node_data = {
            "name": "IF Node - False",
            "logicType": "IF",
            "conf": {
                "condition": "2 == 1"
            },
            "isTriggered": False,
            "positionX": 100.0,
            "positionY": 100.0
        }
        response = requests.post(
            get_node_url(workflow_id),
            json=if_node_data,
            headers=headers
        )
        assert response.status_code == 201
        if_node = response.json()
        execute_data = {
            "input": {"test": "data"}
        }
        exec_response = requests.post(
            f"{get_node_url(workflow_id)}/{if_node['id']}/execute",
            json=execute_data,
            headers=headers
        )
        assert exec_response.status_code in [200, 201]
        exec_data = exec_response.json()
        assert "nodeExecution" in exec_data
        assert exec_data["nodeExecution"]["executionChannel"] == "failed"
        assert exec_data["nodeExecution"]["status"] == "SUCCESS"

class TestAndNode:
    def test_and_node_all_success(self, test_workflow):
        """Test d'un n\u0153ud AND avec tous les n\u0153uds entrants en succ�s"""
        workflow = test_workflow["workflow"]
        headers = test_workflow["headers"]
        workflow_id = workflow["id"]
        if_node1_data = {
            "name": "IF Node 1",
            "logicType": "IF",
            "conf": {"condition": "1 == 1"},
            "isTriggered": False,
            "positionX": 100.0,
            "positionY": 100.0
        }
        if_node2_data = {
            "name": "IF Node 2",
            "logicType": "IF",
            "conf": {"condition": "1 == 1"},
            "isTriggered": False,
            "positionX": 100.0,
            "positionY": 200.0
        }
        node1_resp = requests.post(get_node_url(workflow_id), json=if_node1_data, headers=headers)
        node2_resp = requests.post(get_node_url(workflow_id), json=if_node2_data, headers=headers)
        assert node1_resp.status_code == 201
        assert node2_resp.status_code == 201
        node1 = node1_resp.json()
        node2 = node2_resp.json()
        and_node_data = {
            "name": "AND Node",
            "logicType": "AND",
            "isTriggered": False,
            "positionX": 300.0,
            "positionY": 150.0
        }
        and_resp = requests.post(get_node_url(workflow_id), json=and_node_data, headers=headers)
        assert and_resp.status_code == 201
        and_node = and_resp.json()
        conn1_data = {
            "sourceNodeId": node1["id"],
            "targetNodeId": and_node["id"],
            "channel": "success"
        }
        conn1_resp = requests.post(get_connection_url(workflow_id), json=conn1_data, headers=headers)
        assert conn1_resp.status_code == 201
        conn2_data = {
            "sourceNodeId": node2["id"],
            "targetNodeId": and_node["id"],
            "channel": "success"
        }
        conn2_resp = requests.post(get_connection_url(workflow_id), json=conn2_data, headers=headers)
        assert conn2_resp.status_code == 201
        exec_data = {"input": {"test": "data"}}
        exec1 = requests.post(f"{get_node_url(workflow_id)}/{node1['id']}/execute", json=exec_data, headers=headers)
        exec2 = requests.post(f"{get_node_url(workflow_id)}/{node2['id']}/execute", json=exec_data, headers=headers)
        assert exec1.status_code in [200, 201]
        assert exec2.status_code in [200, 201]
        and_exec_data = {"input": {"test": "data"}}
        and_exec = requests.post(f"{get_node_url(workflow_id)}/{and_node['id']}/execute", json=and_exec_data, headers=headers)
        assert and_exec.status_code in [200, 201]
        and_result = and_exec.json()
        assert and_result["nodeExecution"]["executionChannel"] == "success"
        assert and_result["nodeExecution"]["status"] == "SUCCESS"

    def test_and_node_one_failed(self, test_workflow):
        workflow = test_workflow["workflow"]
        headers = test_workflow["headers"]
        workflow_id = workflow["id"]
        if_node1_data = {
            "name": "IF Node Success",
            "logicType": "IF",
            "conf": {"condition": "1 == 1"},
            "isTriggered": False,
            "positionX": 100.0,
            "positionY": 100.0
        }
        if_node2_data = {
            "name": "IF Node Failed",
            "logicType": "IF",
            "conf": {"condition": "1 == 2"},
            "isTriggered": False,
            "positionX": 100.0,
            "positionY": 200.0
        }
        node1_resp = requests.post(get_node_url(workflow_id), json=if_node1_data, headers=headers)
        node2_resp = requests.post(get_node_url(workflow_id), json=if_node2_data, headers=headers)
        assert node1_resp.status_code == 201
        assert node2_resp.status_code == 201
        node1 = node1_resp.json()
        node2 = node2_resp.json()
        and_node_data = {
            "name": "AND Node",
            "logicType": "AND",
            "isTriggered": False,
            "positionX": 300.0,
            "positionY": 150.0
        }
        and_resp = requests.post(get_node_url(workflow_id), json=and_node_data, headers=headers)
        assert and_resp.status_code == 201
        and_node = and_resp.json()
        conn1_data = {"sourceNodeId": node1["id"], "targetNodeId": and_node["id"], "channel": "success"}
        conn2_data = {"sourceNodeId": node2["id"], "targetNodeId": and_node["id"], "channel": "success"}
        requests.post(get_connection_url(workflow_id), json=conn1_data, headers=headers)
        requests.post(get_connection_url(workflow_id), json=conn2_data, headers=headers)
        exec_data = {"input": {"test": "data"}}
        exec1 = requests.post(f"{get_node_url(workflow_id)}/{node1['id']}/execute", json=exec_data, headers=headers)
        exec2 = requests.post(f"{get_node_url(workflow_id)}/{node2['id']}/execute", json=exec_data, headers=headers)
        execution_id = exec1.json()["nodeExecution"]["executionId"]
        and_exec_data = {"input": {"test": "data"}, "executionId": execution_id}
        and_exec = requests.post(f"{get_node_url(workflow_id)}/{and_node['id']}/execute", json=and_exec_data, headers=headers)
        and_result = and_exec.json()
        assert and_result["nodeExecution"]["executionChannel"] == "failed"


class TestNotNode:
    def test_not_node_success_input(self, test_workflow):
        workflow = test_workflow["workflow"]
        headers = test_workflow["headers"]
        workflow_id = workflow["id"]
        if_node_data = {
            "name": "IF Node Success",
            "logicType": "IF",
            "conf": {"condition": "true"},
            "isTriggered": False,
            "positionX": 100.0,
            "positionY": 100.0
        }
        if_resp = requests.post(get_node_url(workflow_id), json=if_node_data, headers=headers)
        assert if_resp.status_code == 201
        if_node = if_resp.json()
        not_node_data = {
            "name": "NOT Node",
            "logicType": "NOT",
            "isTriggered": False,
            "positionX": 300.0,
            "positionY": 100.0
        }
        not_resp = requests.post(get_node_url(workflow_id), json=not_node_data, headers=headers)
        assert not_resp.status_code == 201
        not_node = not_resp.json()
        conn_data = {
            "sourceNodeId": if_node["id"],
            "targetNodeId": not_node["id"],
            "channel": "success"
        }
        requests.post(get_connection_url(workflow_id), json=conn_data, headers=headers)
        exec_data = {"input": {"test": "data"}}
        if_exec = requests.post(f"{get_node_url(workflow_id)}/{if_node['id']}/execute", json=exec_data, headers=headers)
        execution_id = if_exec.json()["nodeExecution"]["executionId"]
        not_exec_data = {"input": {"test": "data"}, "executionId": execution_id}
        not_exec = requests.post(f"{get_node_url(workflow_id)}/{not_node['id']}/execute", json=not_exec_data, headers=headers)
        not_result = not_exec.json()
        assert not_result["nodeExecution"]["executionChannel"] == "failed"
        assert not_result["nodeExecution"]["status"] == "SUCCESS"
