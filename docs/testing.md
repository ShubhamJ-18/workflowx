# WorkFlowX Testing & Quality Assurance Report

## 1. Test Architecture

WorkFlowX utilizes Node.js's native test runner (`node:test`) paired with `supertest` for zero-overhead, compilation-free API integration testing, along with unit testing for graph algorithms and rule-based risk engines.

---

## 2. Automated Test Suites & Results

All 27 automated tests pass with 0 failures:

```
# tests 27
# suites 5
# pass 27
# fail 0
# cancelled 0
# skipped 0
# duration_ms 1539.07
```

### A. Authentication & Session API Tests (`apps/api/tests/auth.test.js`)
- [x] `registers a new user and returns 201 with session cookie`: Verifies user registration, bcrypt hashing, and issuance of `workflowx_session` HttpOnly cookie.
- [x] `rejects duplicate email registration with 409 Conflict`: Validates email uniqueness constraint.
- [x] `authenticates with valid credentials and rotates session`: Verifies session rotation on login.
- [x] `rejects invalid password with 401 without exposing account details`: Verifies anti-enumeration defense.
- [x] `returns current user with valid session cookie on GET /api/v1/auth/me`: Verifies active session token validation.
- [x] `rejects unauthenticated request to GET /api/v1/auth/me with 401`: Verifies authentication boundary.
- [x] `logs out and invalidates session in database`: Verifies database session deletion and cookie clearing.

### B. Authorization & Cross-Team Security RBAC Tests (`apps/api/tests/rbac.test.js`)
- [x] `allows Alex to view projects in his authorized team`: Validates authorized team member access.
- [x] `STRICT SECURITY: Blocks Dr. Watson from accessing Alex’s private project with 403 Forbidden`: Prevents cross-team ID tampering.
- [x] `STRICT SECURITY: Blocks Alex from viewing Dr. Watson’s private team with 403 Forbidden`: Validates bidirectional multi-tenant boundary.
- [x] `rejects unauthenticated requests to projects with 401`: Validates API route protection.

### C. Dependency Engine & Graph Cycle Detection (`apps/api/tests/dependency_engine.test.js`)
- [x] `rejects self-dependencies`: Prevents a task from depending on itself (`task-A -> task-A`).
- [x] `accepts valid linear dependencies`: Validates acyclic directed edges.
- [x] `detects simple direct 2-node circular dependency (A -> B, then B -> A)`: Cycle detection using DFS traversal.
- [x] `detects complex multi-hop circular dependency (A -> B -> C -> D, then D -> A)`: Validates multi-hop circular loop detection and path reporting.
- [x] `correctly computes all transitive downstream tasks`: Verifies topological blast radius reachability.
- [x] `correctly computes all upstream prerequisite tasks`: Verifies reverse graph traversal.

### D. Deterministic Risk Engine Evaluation (`apps/api/tests/risk_engine.test.js`)
- [x] `evaluates completed tasks as LOW risk with 0 score`: Completed tasks are never flagged as risky.
- [x] `flags overdue tasks with HIGH risk and escalation action`: Deterministic penalty for past deadlines.
- [x] `flags incomplete prerequisites and identifies blocking tasks`: Accurately identifies blocking tasks.
- [x] `escalates to HIGH risk when prerequisite task is overdue`: Cascading delay heuristic.
- [x] `detects assignee workload overload and high downstream impact`: Flags assignee concurrency bottleneck (>4 active tasks).

### E. Projects, Tasks & API Integration Tests (`apps/api/tests/projects_tasks.test.js`)
- [x] `creates two tasks successfully`: Verifies project-scoped task creation.
- [x] `rejects assigning task to an outsider not in the team`: Validates assignee membership verification.
- [x] `creates a valid dependency (Task A -> Task B)`: Verifies dependency creation via REST API.
- [x] `rejects circular dependency (Task B -> Task A) with 400 Bad Request`: Verifies API-level cycle rejection.
- [x] `adds a comment to a task`: Verifies threaded discussion logging.

---

## 3. How to Run the Tests

Ensure the PostgreSQL test database is running and migrated:
```bash
# Run all automated tests
npm run test

# Run individual test suite
node --test apps/api/tests/risk_engine.test.js
node --test apps/api/tests/dependency_engine.test.js
node --test apps/api/tests/auth.test.js
node --test apps/api/tests/rbac.test.js
node --test apps/api/tests/projects_tasks.test.js
```
