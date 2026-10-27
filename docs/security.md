# WorkFlowX Security Architecture & Controls

## 1. Threat Model & Implemented Controls

### A. Authentication & Session Security
- **No Client-Side Token Storage**: Tokens are never persisted in `localStorage` or `sessionStorage` where they are vulnerable to XSS exfiltration.
- **Server-Side Opaque Sessions**: Sessions are generated using `crypto.randomBytes(32)` (256-bit entropy). Only the SHA-256 hash is stored in the PostgreSQL `Session` table.
- **HttpOnly Cookies**: Session identifiers are delivered in an `HttpOnly`, `SameSite=Lax` (or `Strict`), and `Secure` (in production) cookie named `workflowx_session`.
- **Session Rotation**: Session tokens are automatically rotated upon successful authentication and password changes to protect against session fixation.
- **Session Expiration & Revocation**: Sessions expire after 24 hours (configurable). Logging out permanently deletes the record from PostgreSQL. Password resets terminate all existing sessions for the target user.
- **Password Hashing**: Passwords are saved as bcrypt hashes using 12 salt rounds, with constant-time verification.

### B. Authorization & Multi-Tenant Isolation (RBAC)
- **Role Hierarchy**: `OWNER (3) > ADMIN (2) > MEMBER (1)`.
- **Server-Side Verification**: Permissions are strictly enforced via the `requireTeamRole` middleware on the Express server. Frontend UI hiding is treated purely as a UX convenience, never as an authorization control.
- **Parameter Tampering Defense**: Querying, editing, or deleting a resource requires active membership in the parent team. Supplying another team's project ID, task ID, or member ID is rejected with `403 Forbidden`.
- **Self-Elevation Prevention**: Members cannot promote themselves; only an `OWNER` can alter member roles, and sole owners cannot demote or remove themselves without transferring ownership.

### C. Input Validation & Injection Defenses
- **Zod Schema Validation**: All request bodies, parameters, and query strings are validated through strict Zod schemas with custom error formatters. Unexpected attributes and invalid types are rejected with `400 Bad Request`.
- **SQL Injection Prevention**: Database interaction is mediated via Prisma ORM parameterized queries with typed schema models.
- **XSS Mitigation**: React App Router safely escapes all interpolated text strings by default.

### D. Network & Web Protections
- **Helmet Security Headers**: Configures Content Security Policy (CSP), X-Frame-Options (`DENY`), X-Content-Type-Options (`nosniff`), and Strict-Transport-Security (HSTS).
- **CORS Allowlist**: Cross-Origin requests are restricted to an explicit origin allowlist (`http://localhost:3000` in development). Credentialed access is denied to unlisted origins.
- **CSRF & Origin Verification**: All state-changing HTTP operations (`POST`, `PUT`, `PATCH`, `DELETE`) validate `Origin` and `Referer` headers against allowed domains.
- **Rate Limiting**:
  - General API: 500 requests per 15-minute window per IP.
  - Authentication: 50 requests per 15-minute window to mitigate brute-force password guessing.

### E. Account Recovery & Anti-Enumeration Protections
- **Anti-Enumeration Responses**: `/api/v1/auth/forgot-password` and `/api/v1/auth/login` return generic status responses that prevent attackers from determining whether an email address is registered.
- **Expiring Single-Use Tokens**: Recovery tokens are generated with 256 bits of cryptographic entropy, stored exclusively as SHA-256 hashes, expire in 1 hour, and are marked `usedAt` upon consumption.

### F. Privacy-Conscious Logging
- Structured JSON logging masks passwords, password hashes, session cookies, tokens, and authorization headers (`[REDACTED]`).
- Internal stack traces and database error codes are hidden in production API responses.

---

## 2. Production Deployment Hardening Checklist

- [ ] Ensure `NODE_ENV=production` is set in production runtime environments.
- [ ] Set `SESSION_SECURE_COOKIE=true` so session cookies require HTTPS.
- [ ] Provide a random, high-entropy `SESSION_SECRET` (e.g. `openssl rand -hex 32`).
- [ ] Connect through a dedicated, non-superuser PostgreSQL account with restricted schema permissions.
- [ ] Set explicit `CORS_ORIGIN` matching your production domain (e.g., `https://workflowx.app`).
- [ ] Configure reverse proxy headers (`X-Forwarded-For`, `X-Forwarded-Proto`) when running behind Cloudflare or NGINX.
