# Platform administration and tenant management

## Purpose and boundary

Nexus has one authentication identity: `users`. A product owner is not a second kind of login and does not get a separate password table or token system. A platform administrator is an ordinary active user who has an explicit platform-level authorization grant.

Tenant workspace data has one owner in the codebase: the `tenants` module. The `admin` module owns platform access and platform-level use cases, but it does not duplicate tenant queries or define a second tenant model. Admin HTTP routes delegate workspace operations to the tenant service. Workspace membership roles (`owner`, `admin`, `member`) remain separate from the platform administrator grant.

```text
Browser
  /admin/login ── shared email/password login ──> /api/v1/auth/login
  /admin        ── admin console ───────────────> /api/v1/admin/*

API
  AuthModule: users, password verification, session cookie, AuthGuard
       │
       ├── AdminModule: platform admin authorization + admin use cases
       │       └── delegates tenant operations to TenantService
       └── TenantsModule: tenant repository + tenant service + tenant data rules

Database
  users ── sessions
    ├── memberships ── tenants
    └── platform_admins
```

## Sign-in and first administrator provisioning

1. The product owner registers through the existing signup flow. This creates a normal `users` identity, a tenant, an owner membership, and a session atomically.
2. A trusted operator runs the one-time administrative CLI command with that existing account's email. The command finds the user and grants platform administrator access in `platform_admins`. It does not accept arbitrary new user details or create credentials.
3. The product owner signs in through the same `/api/v1/auth/login` endpoint and the same shared login UI. `/admin/login` is a frontend entry point that takes the user to `/admin` after the shared login succeeds.
4. Admin API routes first validate the normal session (`AuthGuard`), then require an active `platform_admins` grant (`PlatformAdminGuard`). Workspace owner/admin membership is never sufficient for platform access.
5. Admin frontend routes call the admin session endpoint. Unauthenticated users go to `/admin/login`; authenticated users without the grant see an access-denied page. Authorized users see the admin console.

There is no public admin registration or role-escalation endpoint. The bootstrap CLI is a trusted deployment/operator action. Future administrators can be granted or revoked by an authorized platform administrator through an audited workflow.

## Module responsibilities

### `auth`

- Owns global user identity, password verification, session issuance/revocation, and `AuthGuard`.
- Does not know about platform roles or admin console behavior.
- Continues to authenticate every user, including platform administrators.

### `tenants`

- Owns tenant persistence and rules: lookup, listing/pagination, rename/slug changes, and status changes.
- Owns the tenant repository and transaction boundary for tenant writes.
- Is the sole code owner of tenant data operations. Other modules call its service rather than reimplementing queries.
- Signup may continue to create a tenant within its existing atomic account-creation transaction until signup is explicitly refactored to a tenant use case without weakening atomicity.

### `admin`

- Owns platform administrator grants, guard, controller, request validation, and platform use cases.
- Exposes `/api/v1/admin/*` and delegates tenant operations to `TenantService`.
- Does not introduce a second `tenants` table, tenant repository, credential system, or tenant role.

## Initial product scope

- List tenants with pagination and basic search/status filters.
- View a tenant and its membership/user summary.
- Rename a tenant, change its slug, suspend it, and reactivate it.
- View the admin's own platform access state.
- Emit a structured application log for each platform tenant mutation, including the actor, target, and changed fields but no credential/session data. Add durable audit storage when retention and review requirements are defined.
- Do not hard-delete tenants or create a tenant without an owner/onboarding flow. Do not add billing, analytics, impersonation, or a general permissions engine in this iteration.

## Routes

| Frontend | Backend | Purpose |
| --- | --- | --- |
| `/admin/login` | `POST /api/v1/auth/login` | Shared identity sign-in |
| `/admin` | `GET /api/v1/admin/me`, `GET /api/v1/admin/overview` | Check platform grant and show console overview |
| `/admin/tenants` | `GET /api/v1/admin/tenants` | Browse tenants through admin use case |
| `/admin/tenants/:id` | `GET /api/v1/admin/tenants/:id` | Inspect tenant and membership summary |
| `/admin/tenants/:id` | `PATCH /api/v1/admin/tenants/:id` | Rename, change slug, suspend/reactivate |

Every `/api/v1/admin/*` API route is protected by both `AuthGuard` and `PlatformAdminGuard`. Mutations also validate request origin. The frontend is only a client of these endpoints; authorization is enforced by the API.

## Database and migrations

- `users` remains the only identity/credential table.
- Add `platform_admins`, keyed by `user_id` (FK to users), with grant timestamp and optional granting user. One row means platform access; absence means no platform access.
- Do not add an audit table in this MVP; it adds a second write contract and retention policy without a current product requirement. Structured logs record the initial admin actions.
- Keep schema definitions separated by table under `database/schema/`.
- Keep each table's migration in its module folder, one migration file per table change under `drizzle/admin/`; journal entries preserve global application order.
- Tenant updates are single-row writes with database uniqueness and foreign-key constraints as final consistency checks. Use normal PostgreSQL isolation.
- Do not store passwords, session cookies, invitation tokens, or other secrets in platform tables or audit payloads.

## SOLID and dependency direction

- Controllers handle HTTP and validation; services coordinate a use case; repositories own persistence.
- `AdminService` owns platform admin use cases and delegates tenant operations to the exported `TenantService` contract.
- `TenantService` owns tenant rules and depends on `TenantRepository`; admin must not query tenant tables itself.
- `PlatformAdminGuard` depends on an admin access service/repository, not on tenant membership roles.
- Keep interfaces only at meaningful module seams. Do not add a generic repository factory, event bus, CQRS, or service-per-field abstraction.

## Rollout

Apply the additive admin migrations. Create the product owner's normal account using the existing signup flow, then use the operator CLI to grant the first `platform_admins` row. Sign in at `/admin/login` and verify the API grant before accessing tenant operations. Removing the admin grant revokes platform authorization without deleting the user or invalidating their normal workspace account.
