# WorkFlowX REST API Reference (v1)

All endpoints are versioned under `/api/v1` and return standardized JSON payloads:
```json
{
  "success": true,
  "message": "Human-readable status",
  "data": { ... }
}
```

---

## 1. Authentication & Identity (`/api/v1/auth`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Register new user and start session | No |
| `POST` | `/api/v1/auth/login` | Authenticate credentials & rotate session | No |
| `POST` | `/api/v1/auth/logout` | Invalidate active session & clear cookie | Yes |
| `GET` | `/api/v1/auth/me` | Fetch active user profile and team memberships | Yes |
| `POST` | `/api/v1/auth/forgot-password` | Issue single-use password recovery token | No |
| `POST` | `/api/v1/auth/reset-password` | Set new password with token and revoke sessions | No |
| `PUT` | `/api/v1/auth/profile` | Update user name and avatar | Yes |
| `PUT` | `/api/v1/auth/change-password` | Update password & invalidate other sessions | Yes |

---

## 2. Teams & Workspaces (`/api/v1/teams`)

| Method | Endpoint | Description | Required Role |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/teams` | List workspaces user belongs to | Authenticated |
| `POST` | `/api/v1/teams` | Create new team workspace (caller becomes OWNER) | Authenticated |
| `GET` | `/api/v1/teams/:teamId` | Get team details, members, and projects | `MEMBER` |
| `PUT` | `/api/v1/teams/:teamId` | Update team name and mission | `ADMIN` |
| `DELETE` | `/api/v1/teams/:teamId` | Delete entire workspace | `OWNER` |
| `POST` | `/api/v1/teams/:teamId/members` | Issue expiring invitation token | `ADMIN` |
| `PUT` | `/api/v1/teams/:teamId/members/:userId` | Change member role (OWNER, ADMIN, MEMBER) | `OWNER` |
| `DELETE` | `/api/v1/teams/:teamId/members/:userId` | Remove member from team | `ADMIN` |
| `POST` | `/api/v1/teams/invitations/accept` | Accept invitation token to join team | Authenticated |

---

## 3. Projects (`/api/v1/projects`)

| Method | Endpoint | Description | Required Role |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/projects` | List projects (supports `teamId`, `status`, `search`) | `MEMBER` |
| `POST` | `/api/v1/projects` | Create a new project in team | `MEMBER` |
| `GET` | `/api/v1/projects/:projectId` | Project overview, statistics, and task counts | `MEMBER` |
| `PUT` | `/api/v1/projects/:projectId` | Update project milestone dates and status | `ADMIN` |
| `DELETE` | `/api/v1/projects/:projectId` | Delete project and its tasks | `ADMIN` |

---

## 4. Tasks & Dependencies (`/api/v1/tasks`)

| Method | Endpoint | Description | Required Role |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/tasks` | Query tasks with risk evaluation and sorting | `MEMBER` |
| `POST` | `/api/v1/tasks` | Create task and assign to team member | `MEMBER` |
| `GET` | `/api/v1/tasks/:taskId` | Get task, complete dependency graph, and risk report | `MEMBER` |
| `PUT` | `/api/v1/tasks/:taskId` | Update task details and status | `MEMBER` |
| `PATCH` | `/api/v1/tasks/:taskId/status` | Quick status transition for Kanban boards | `MEMBER` |
| `DELETE` | `/api/v1/tasks/:taskId` | Delete deliverable | `ADMIN` |
| `POST` | `/api/v1/tasks/:taskId/dependencies` | Add prerequisite dependency with cycle detection | `MEMBER` |
| `DELETE` | `/api/v1/tasks/:taskId/dependencies/:predId` | Remove prerequisite relationship | `MEMBER` |
| `POST` | `/api/v1/tasks/:taskId/comments` | Post discussion comment | `MEMBER` |

---

## 5. Dashboard, Notifications & Audit (`/api/v1/dashboard`, `/notifications`, `/activity`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/dashboard/metrics?teamId=:id` | Real-time delivery health and risk metrics | Yes |
| `GET` | `/api/v1/notifications` | User notifications with unread counter | Yes |
| `PATCH` | `/api/v1/notifications/:id/read` | Mark individual notification as read | Yes |
| `POST` | `/api/v1/notifications/read-all` | Mark all user notifications as read | Yes |
| `GET` | `/api/v1/activity?teamId=:id` | Chronological team audit log | Yes |
| `GET` | `/api/v1/health` | Health check endpoint | No |
