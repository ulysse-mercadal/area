

# User journeys

This document describes the main user journeys for FlowConnect, updated after analyzing the front-end (webapp + mobile). For each journey: actor, preconditions, concrete steps, screens/routes, called endpoints and edge cases.

## 1. Sign up & sign in (Web + Mobile)
- Actor: New user / returning user
- Preconditions: access to a valid email address (or an OAuth account)

Steps (web):
1. The user opens `/register` or `/login` from the landing page `/`.
2. They can register via the form (first name, last name, email, password) (`/register`) or log in (`/login`).
3. The web app also offers OAuth buttons pointing to `${API_URL}/auth/google`, `/auth/microsoft`, `/auth/github` (redirect flow).
4. After successful login, the token is stored (localStorage) and the user is redirected to `/workflows`.

Steps (mobile):
1. The user opens the Flutter app and goes to the Login or Register screen (Routes.map).
2. Login/register calls the API (`/auth/login`, `/auth/register`) via `http` and stores the token in `SharedPreferences`.
3. On success, the app navigates to the `Credentials` screen.

Screens / endpoints:
- Web routes: `/register`, `/login`, `/workflows`, `/credentials`.
- Mobile routes: `/`, `/register`, `/login`, `/credentials`, `/workflow`.
- API: `POST /auth/register`, `POST /auth/login`, external OAuth endpoints.

Success criteria:
- Token present on the client, access to protected routes (`ProtectedRoute` on the web front), appropriate redirection.

Edge cases:
- Server returns 4xx/5xx -> show error message (web: UI error, mobile: SnackBar).
- OAuth flow does not return an `authUrl` -> show an error message.

## 2. List and manage credentials (connect services)
- Actor: Authenticated user
- Preconditions: user authenticated (valid token)

Steps (web):
1. The user opens `/credentials` (CredentialsDashboard).
2. The app calls `GET ${API_URL}/services` to fetch available services.
3. To connect a service the front calls `POST ${API_URL}/credentials/connect/{serviceId}`; the server returns an `authUrl`.
4. The browser is redirected to `authUrl` (or the URL is opened in the same window) to complete OAuth.
5. After the API callback, the service is listed as `connected` (front refreshes the GET request).

Steps (mobile):
1. The user opens the Credentials screen.
2. `_connect(service)` calls `POST /credentials/connect/{serviceId}` and opens the auth URL in-app (WebView) or in the browser via `url_launcher`.
3. On success the screen updates (status becomes `connected`).

Endpoints: `GET /services`, `POST /credentials/connect/{serviceId}`, `GET /credentials/user/{userId}` to fetch a user's credentials.

Edge cases:
- API does not return `authUrl` -> notify the user.
- Token expired -> show reconnect / re-authenticate button.

## 3. Create and edit a workflow (visual editor)
- Actor: Authenticated user
- Preconditions: valid token, preferably at least one connected service to use actions/reactions

Steps (web, React Flow editor):
1. From `/workflows`, the user clicks "Create" or opens an existing workflow (`/workflow/:id`).
2. The editor (`CreateWorkflow`) loads nodes and connections via `GET /workflow/{id}/node` and `GET /workflow/{id}/connection`.
3. The user adds an Action/Reaction/Logic node from the menu (`showActionMenu` / `showReactionMenu` / `showLogicModal`).
4. When adding a node, the front calls `POST /workflow/{id}/node` (`createNodeApi`) and adds the node to the React Flow graph.
5. To connect nodes the user creates edges; the `onConnect` handler calls `POST /workflow/{id}/connection`.
6. To edit a node's configuration they double-click / open `NodeEditor`, fill parameters, then `onSave` calls `PATCH /workflow/{id}/node/{nodeId}`.
7. Position changes (drag stop) trigger updates to `positionX` / `positionY` via `PATCH`.
8. To save globally (mobile), the UX calls `WorkflowService.createNode`/`update` and `createConnection` according to the implemented sync logic.

Steps (mobile):
1. The `WorkflowPage` screen allows drag & drop from `NodeDrawer` and assembles a structure in memory.
2. The user taps `Save` to sync nodes and connections via `WorkflowService.createNode` / `createConnection`.

Endpoints: `GET /workflow/`, `POST /workflow`, `GET|POST|PATCH|DELETE /workflow/{id}/node`, `POST /workflow/{id}/connection`.

Edge cases:
- Node without required `conf` or missing required parameters -> UI blocks save and highlights required fields.
- Network error during creation -> local fallback (web: fallback edge creation) and error message.

## 4. Execute a workflow and monitoring
- Actor: User / Operator
- Preconditions: workflow containing at least one node and a valid token

Steps:
1. From the list (`/workflows`) or from the editor (`/workflow/:id`), the user clicks "Play" or "Execute".
2. The front fetches the first node (fetchNodes) if needed and calls `POST /workflow/{id}/node/{startNodeId}/execute`.
3. During execution the front shows popups/toasts (`showPopup`) indicating state (executing / success / error).
4. On error the user can consult server logs (expected endpoint `GET /executions/{id}`) and trigger a retry (`POST /executions/{id}/retry` or re-execute the start node).

Endpoints involved: `POST /workflow/{id}/node/{nodeId}/execute`, `GET /workflow/{id}/node` (to fetch start node), execution/log endpoints if available.

Edge cases:
- No nodes -> alert "No nodes in workflow".
- Server error -> error popup showing detailed text from the response.

## 5. Team / admin management (invitations & roles)
- Actor: Owner / Admin
- Preconditions: account with `ADMIN` role (enforced by `ProtectedRoute role={'ADMIN'}`)

Steps:
1. The admin navigates to `/admin/users` (available from the menu when `user.role === 'ADMIN'`).
2. They can view the user list and use the UI to invite/promote/revoke accounts (UI exists in `Admin/Users.tsx`).
3. The associated API calls (invitations, role changes) are expected on the backend; the front calls the corresponding endpoints.

Edge cases:
- Non-admin attempts to access -> `ProtectedRoute` blocks access and redirects.

---
