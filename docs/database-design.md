# WorkFlowX Database Design Document

## 1. Entity Relationship (ER) Diagram

```mermaid
erDiagram
    User ||--o{ Session : "authenticates"
    User ||--o{ TeamMember : "belongs to"
    User ||--o{ Team : "creates"
    User ||--o{ Project : "creates"
    User ||--o{ Task : "assigned to / creates"
    User ||--o{ Comment : "authors"
    User ||--o{ ActivityLog : "triggers"
    User ||--o{ Notification : "receives"
    User ||--o{ PasswordResetToken : "requests"
    User ||--o{ Invitation : "issues"

    Team ||--|{ TeamMember : "has"
    Team ||--o{ Project : "contains"
    Team ||--o{ Invitation : "issues"
    Team ||--o{ ActivityLog : "logs"

    Project ||--o{ Task : "organizes"

    Task ||--o{ Comment : "has"
    Task ||--o{ TaskDependency : "predecessor (waited upon)"
    Task ||--o{ TaskDependency : "successor (waits upon)"

    User {
        string id PK "UUID"
        string name
        string email UK "Indexed"
        string passwordHash
        string avatarUrl
        datetime createdAt
        datetime updatedAt
    }

    Session {
        string id PK "UUID"
        string sessionTokenHash UK "SHA-256 Hash"
        string userId FK
        string ipAddress
        string userAgent
        datetime expiresAt "Indexed"
        datetime createdAt
    }

    Team {
        string id PK "UUID"
        string name
        string description
        string createdBy FK
        datetime createdAt
        datetime updatedAt
    }

    TeamMember {
        string id PK "UUID"
        string teamId FK
        string userId FK
        enum role "OWNER, ADMIN, MEMBER"
        datetime joinedAt
    }

    Project {
        string id PK "UUID"
        string teamId FK
        string name
        string description
        enum status "PLANNING, ACTIVE, ON_HOLD, COMPLETED, ARCHIVED"
        datetime startDate
        datetime dueDate
        string createdBy FK
        datetime createdAt
        datetime updatedAt
    }

    Task {
        string id PK "UUID"
        string projectId FK "Indexed"
        string title
        string description
        enum status "TODO, IN_PROGRESS, BLOCKED, DONE"
        enum priority "LOW, MEDIUM, HIGH, URGENT"
        string assigneeId FK "Indexed"
        string createdBy FK
        datetime dueDate "Indexed"
        float estimatedHours
        int position
        datetime createdAt
        datetime updatedAt
    }

    TaskDependency {
        string id PK "UUID"
        string predecessorTaskId FK "Indexed"
        string successorTaskId FK "Indexed"
        datetime createdAt
    }

    Comment {
        string id PK "UUID"
        string taskId FK "Indexed"
        string authorId FK
        string content
        datetime createdAt
        datetime updatedAt
    }

    ActivityLog {
        string id PK "UUID"
        string teamId FK "Indexed"
        string actorId FK
        string entityType
        string entityId
        string action
        json metadata
        datetime createdAt
    }

    Notification {
        string id PK "UUID"
        string recipientId FK "Indexed"
        string type
        string title
        string message
        string entityType
        string entityId
        datetime readAt
        datetime createdAt
    }

    PasswordResetToken {
        string id PK "UUID"
        string userId FK
        string tokenHash UK "SHA-256 Hash"
        datetime expiresAt
        datetime usedAt
        datetime createdAt
    }
```

---

## 2. Relational Constraints & Integrity Guarantees

1. **Unique Team Membership**: `@@unique([teamId, userId])` prevents duplicate memberships in the same workspace.
2. **Unique Task Dependencies**: `@@unique([predecessorTaskId, successorTaskId])` prevents redundant edges in the dependency graph.
3. **Cascade Deletions**:
   - Deleting a team cascades its members, projects, and invitations.
   - Deleting a project cascades its tasks and dependencies.
   - Deleting a task cascades its comments and dependency relationships.
4. **Referential Integrity for Audit Trail**:
   - `ActivityLog` entries reference actor and team; team deletion cleanly cascades audit records.

---

## 3. Indexing Strategy

- **`User(email)`**: Fast B-tree index for O(1) login lookups.
- **`Session(sessionTokenHash, expiresAt)`**: Immediate hash lookup for session authorization and cleanup of expired tokens.
- **`Task(projectId, status, priority, assigneeId, dueDate)`**: Composite and single-column indexes for high-speed Kanban filtering, dashboard aggregates, and deadline queries.
- **`TaskDependency(predecessorTaskId, successorTaskId)`**: High-speed traversal during cycle detection and downstream blast radius evaluation.
- **`Notification(recipientId, readAt)`**: Instant unread badge counts and notification queries.

---

## 4. Backup & Recovery Guidance

### Periodic Backup via `pg_dump`
```bash
pg_dump -U postgres -h localhost -d workflowx_dev -F c -b -v -f "workflowx_backup_$(date +%Y%m%d_%H%M%S).dump"
```

### Restoration via `pg_restore`
```bash
pg_restore -U postgres -h localhost -d workflowx_dev -v "workflowx_backup_YYYYMMDD_HHMMSS.dump"
```
