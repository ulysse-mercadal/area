# User Stories

This file gathers the user stories for the FlowConnect project. Each story follows the format:
As a <role>, I want <goal>, so that <benefit>. Acceptance criteria (AC) are provided.

## 1. Authentication (User)
- As a user,
- I want to register and log in using email/password or via OAuth providers (Google, Microsoft, GitHub),
- So I can access the web and mobile interfaces.

AC:
- Supported endpoints: `POST /auth/login`, `POST /auth/register`, OAuth endpoints (`/auth/google`, `/auth/github`, ...).
- The token is stored client-side (localStorage on web, SharedPreferences on mobile) and sent in `Authorization: Bearer <token>`.
- Clear error flows (invalid credentials, invalid token, redirect after OAuth).

## 2. Profile management (User)
- As a user,
- I want to view and edit my profile (first name, last name, email, settings),
- So I can adjust my information and preferences.

AC:
- UI accessible via `/account` (web) and the Account screen (mobile).
- Changes are sent to the API and reflected in the UI.

## 3. Connect and manage credentials (User)
- As a user,
- I want to list available services and connect/disconnect my accounts (OAuth / token),
- So I can use these services as actions or reactions in a workflow.

AC:
- UI: `/credentials` (web) and the Credentials screen (mobile).
- Calls `GET /services` to list services, `POST /credentials/connect/{serviceId}` to start auth flows, `DELETE /credentials/user/{userId}/service/{serviceId}` to revoke.
- Shows connection status (connected / disconnected / expired) and can open the authentication URL in an in-app browser (mobile) or redirect (web).

## 4. Create, edit and view workflows (User)
- As a user,
- I want to create, delete and edit workflows,
- So I can automate tasks between services.

AC:
- CRUD workflows via `/workflow` (GET, POST, PUT, DELETE).
- Visual editor based on React Flow (web) and a drag & drop editor (mobile) with node types: Action, Reaction, Logic.
- Save nodes via `POST /workflow/{id}/node`, update via `PATCH/PUT`, delete via `DELETE`.
- Edit positions and persist (`positionX` / `positionY`) and manage connections via `/workflow/{id}/connection`.

## 5. Node configuration (User)
- As a user,
- I want to open a panel/modal to configure a node (choose action/reaction, fill parameters, bind credentials),
- So each node can be executed correctly.

AC:
- `NodeEditor` (web) and parameter dialogs (mobile) list the inputs for an action/reaction and allow saving `conf`.
- Available variables coming from previous node outputs are shown (`prevOutputs`) and can be used as inputs.
- Parameters are sent in the node's `conf` field when saved.

## 6. Logical connections (sources / success / failed) (User)
- As a user,
- I want to connect nodes with normal connections and conditional outputs (true/false) for logic nodes,
- So I can express alternate paths in a workflow.

AC:
- Create edges via the UI which call `POST /workflow/{id}/connection`.
- Logic nodes expose two outputs (`true`/`false`); the UI maps these outputs to `true`/`false` handles.

## 7. Execution, monitoring and retry (User)
- As a user,
- I want to execute a workflow manually (Execute workflow), view execution status, and retry failed runs,
- So I can validate and fix my automations.

AC:
- Execution triggered via `POST /workflow/{id}/node/{startNodeId}/execute` (web) and via `WorkflowService` (mobile).
- Show popups/toasts during execution and success/error messages.
- Access logs/outputs of nodes (execution detail UI) and provide retry options.

## 8. Workflows dashboard (User)
- As a user,
- I want to see the list of my workflows, their status (active/inactive), and quick actions (play, toggle, edit, delete),
- So I can manage my automations.

AC:
- Page `/workflows` (web) shows a `WorkflowCard` for each workflow and actions (play, toggle, edit, delete).
- Features: create new, rename, duplicate.

## 9. Administration and user management (Admin)
- As an admin/owner,
- I want to manage workspace users (promote, revoke),
- So I can control access.

AC:
- Protected route `/admin/users` available for accounts with the `ADMIN` role.
- Invitation/management API expected and UI to assign roles.

## 10. API & Developer integration (Developer)
- As a developer,
- I want well-documented endpoints to automate creation/management of workflows and nodes,
- So I can integrate FlowConnect into pipelines and third-party tools.

AC:
- CRUD endpoints for workflows, nodes, connections, credentials and executions.
- SDKs/clients (optional) or examples via `WorkflowService` / mobile services.
---

