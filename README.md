# WorkFlowX — Secure Full-Stack Team Project Management & Task Risk Platform

![WorkFlowX Platform](https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1200&auto=format&fit=crop&q=80)

WorkFlowX is an enterprise-minded, full-stack project management platform built for student developers, agile engineering teams, and organizations. Moving beyond basic Kanban boards and frontend prototypes, WorkFlowX pairs relational database integrity with a **Task Dependency & Rule-Based Risk Analysis Engine** that deterministically explains why deliverables are blocked or at risk.

---

## 🌟 Key Features

### 1. Directed Task Dependency Engine (Signature Feature)
- **Acyclic Dependency Sequences**: Define prerequisite-successor relationships (`Task A -> Task B`).
- **Graph Traversal Cycle Detection**: Uses Depth-First Search (DFS) to prevent circular dependency deadlocks (`A -> B -> C -> A`). Circular attempts are rejected with detailed cycle paths.
- **Cascading Unblocking**: When a prerequisite task is marked `DONE`, downstream tasks are evaluated. Tasks whose prerequisites have all completed automatically transition from `BLOCKED` to `TODO` with instant notifications.

### 2. Transparent Rule-Based Risk Analysis Engine (Signature Feature)
- **Deterministic Rubric**: Evaluates real database factors without arbitrary "black-box" scoring:
  - Overdue deadlines (`dueDate < now`)
  - Impending deadlines within 24h or 72h
  - Incomplete or overdue prerequisite chains
  - Explicitly blocked flags
  - Assignee workload concentration (> 4 concurrent active tasks)
  - Estimated hours vs remaining time until due date
  - Blast radius (downstream affected task count)
- **Actionable Explanations**: Generates risk level (`LOW`, `MEDIUM`, `HIGH`), explicit reason breakdown, downstream blast radius count, and recommended next actions.

### 3. Enterprise Security & Multi-Tenant Authorization
- **Server-Side Opaque Sessions**: 256-bit entropy random tokens stored as SHA-256 hashes in PostgreSQL; delivered via `HttpOnly`, `SameSite=Lax`, and `Secure` cookies.
- **Session Rotation & Revocation**: Sessions rotate on authentication; password resets revoke all other active sessions across devices.
- **Strict Role-Based Access Control (RBAC)**: `OWNER`, `ADMIN`, and `MEMBER` roles enforced on every API route. Prevents cross-team ID tampering (accessing Team B by altering a URL or payload is rejected with `403 Forbidden`).
- **Cryptographic Account Recovery**: Anti-enumeration recovery flow using single-use hashed tokens.
- **Defensive Middleware**: Helmet security headers, CORS origin allowlisting, CSRF origin verification, Zod input validation, and rate limiters.

### 4. Interactive SaaS Interface
- Modern dashboard with 6 KPI cards, status distribution bar, high-risk alert cards, upcoming deadlines, project completion bars, and team workload tables.
- Interactive Kanban Board across `TODO`, `IN_PROGRESS`, `BLOCKED`, and `DONE`.
- Task detail modals with real-time risk analysis reports, dependency sequence tools, and threaded discussion comments.
- Workspace team management with single-use cryptographic invitation tokens.
- Immutable activity audit logs and in-app notifications.

---

## 🛠️ Technology Stack

| Tier | Technologies |
| :--- | :--- |
| **Frontend** | Next.js 14 (App Router), React 18, Tailwind CSS, Lucide React Icons |
| **Backend** | Node.js, Express.js REST API (`/api/v1`), Zod Validation, Helmet, CORS |
| **Database** | PostgreSQL 18, Prisma ORM (v6), Migrations & Foreign Key Constraints |
| **Security** | Bcrypt (12 rounds), Crypto Random Tokens, HttpOnly Cookies, CSRF Guard |
| **Testing** | Node.js Native Test Runner (`node:test`), Supertest Integration Suite |

---

## 📁 Monorepo Structure

```
WorkFlowX/
├── apps/
│   ├── api/                     # Express.js REST API Server (Port 4000)
│   │   ├── src/
│   │   │   ├── config/          # Zod environment validator, Prisma client
│   │   │   ├── middleware/      # Auth, RBAC, Validation, Rate Limiter, CSRF, Error Handler
│   │   │   ├── modules/         # Auth, Teams, Projects, Tasks, Dashboard, Notifications, Activity
│   │   │   ├── routes/          # Versioned REST router (/api/v1)
│   │   │   ├── utils/           # Crypto helpers, Logger, Response formatters
│   │   │   ├── app.js           # Express application configuration
│   │   │   └── server.js        # Server entry point & graceful shutdown
│   │   └── tests/               # 27 automated unit & integration tests
│   └── web/                     # Next.js 14 App Router Frontend (Port 3000)
│       ├── app/                 # 16 App Router pages
│       ├── components/          # KanbanBoard, Modals, RiskBadge, AppShell
│       ├── context/             # AuthContext & Workspace switcher
│       └── lib/                 # Fetch API client wrapper
├── packages/
│   └── shared/                  # Common domain models, constants, risk logic, and cycle detection
├── prisma/
│   ├── schema.prisma            # PostgreSQL relational schema
│   ├── migrations/              # SQL migration records
│   └── seed.js                  # Realistic development seed dataset with 5 personas
├── docs/
│   ├── architecture.md          # System architecture & data flow diagrams
│   ├── database-design.md       # ER diagram, constraints, and indexes
│   ├── api-reference.md         # Complete REST API reference
│   ├── security.md              # Security controls & hardening checklist
│   ├── testing.md               # Automated testing suite and results
│   └── workflowx-postman-collection.json # Ready-to-import Postman collection
├── .env.example                 # Environment configuration template
└── package.json                 # Monorepo workspaces definition
```

---

## 🚀 Quickstart & Setup Guide

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher (v22 LTS recommended)
- **PostgreSQL**: v14.0 or higher running locally or in Docker
- **npm**: v9.0.0 or higher

### 2. Environment Configuration
Copy the template and configure your local PostgreSQL connection string:
```bash
cp .env.example .env
```
Edit `.env` with your PostgreSQL credentials:
```env
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/workflowx_dev?schema=public"
TEST_DATABASE_URL="postgresql://postgres:your_password@localhost:5432/workflowx_test?schema=public"
SESSION_SECRET="dev_session_secret_change_in_production_32chars"
PORT=4000
NEXT_PUBLIC_API_URL="http://localhost:4000/api/v1"
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Run Database Migrations & Seeds
```bash
# Apply Prisma migrations to PostgreSQL
npm run prisma:migrate

# Seed development database with realistic test dataset
npm run prisma:seed
```

### 5. Start the Application
Start both the backend API and Next.js frontend concurrently:
```bash
# In Terminal 1 (Start Express API on Port 4000):
npm run dev:api

# In Terminal 2 (Start Next.js Frontend on Port 3000):
npm run dev:web
```

Visit **`http://localhost:3000`** in your browser.

---

## 👥 Seeded Demo Accounts

All demo accounts share the password: **`Password123!`**

| Persona | Email | Workspace Role | Purpose |
| :--- | :--- | :--- | :--- |
| **Alex Chen** | `alex.lead@workflowx.dev` | `OWNER` | Team Lead, full admin & role management |
| **Sarah Connor** | `sarah.eng@workflowx.dev` | `ADMIN` | Senior Engineer, project & member management |
| **Marcus Brody** | `marcus.dev@workflowx.dev` | `MEMBER` | Developer with assigned deliverables & overdue task |
| **Elena Rostova** | `elena.design@workflowx.dev` | `MEMBER` | UI/UX Lead with sample blocked deliverable |
| **Dr. Watson** | `watson.research@workflowx.dev` | `OWNER (Isolated)` | Tests multi-tenant isolation & 403 barriers |

*Tip: The login page includes one-click buttons to instantly fill and sign in with any of these personas.*

---

## 🧪 Running Automated Tests

Run the full automated test suite covering authentication, RBAC boundaries, CRUD operations, cycle detection, and risk heuristics:
```bash
npm run test
```

All **27 test cases** run against isolated test fixtures and pass with zero failures. Detailed breakdown available in [`docs/testing.md`](file:///s:/projects/WorkFlowX%20%E2%80%94%20Smart%20Team%20Task%20&%20Project%20Management%20Platform/docs/testing.md).

---

## 📖 API Documentation & Postman

- Complete OpenAPI and REST reference: [`docs/api-reference.md`](file:///s:/projects/WorkFlowX%20%E2%80%94%20Smart%20Team%20Task%20&%20Project%20Management%20Platform/docs/api-reference.md)
- Importable Postman Collection: [`docs/workflowx-postman-collection.json`](file:///s:/projects/WorkFlowX%20%E2%80%94%20Smart%20Team%20Task%20&%20Project%20Management%20Platform/docs/workflowx-postman-collection.json)

---

## 🔒 Security Hardening

For production environments, ensure:
1. `NODE_ENV=production` is enabled.
2. `SESSION_SECURE_COOKIE=true` is set (enforces HTTPS-only cookies).
3. `CORS_ORIGIN` matches the exact frontend domain.
4. Database accounts operate with least-privilege permissions.

Full threat model and vulnerability analysis available in [`docs/security.md`](file:///s:/projects/WorkFlowX%20%E2%80%94%20Smart%20Team%20Task%20&%20Project%20Management%20Platform/docs/security.md).

---

## 📄 License
MIT © WorkFlowX Team
