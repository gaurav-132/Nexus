# Nexus API

The API is a NestJS modular monolith with a single V1 module root. The global route prefix is `/api/v1`. V1 endpoints follow controller → service → repository: controllers handle HTTP, services implement use cases, and repositories own database reads and transactions. Shared API response and error handling are in `src/common/api-response/`.

Authentication uses `users` as the source of identity and credentials, with globally unique normalized emails. `memberships` connect that identity to workspaces and hold workspace roles. `invitations` grant memberships, while `sessions` store only a hash of the random cookie token and track the active membership. The auth repository resolves the user and memberships on authenticated requests.

The API is organized by feature first. `modules/v1/auth/` owns login/session flows; `modules/v1/tenants/` is the only owner of tenant persistence and business rules; `modules/v1/admin/` owns platform access and delegates tenant operations to `TenantService`. Each feature keeps its MVC files together rather than scattering one feature across global controller/service/repository directories.

Inside auth, each file has a focused role:

- `auth.controller.ts` — HTTP routes, cookie handling, and request-boundary validation.
- `auth.service.ts` — signup/login business flow and safe public identity mapping.
- `auth.repository.ts` — Drizzle queries and transactions for signup, login sessions, workspace selection, and invitation acceptance.
- `auth-input.schema.ts` — Zod request schemas.
- `auth-context.ts` — authenticated request type, guard, and current-user decorator.
- `auth-security.ts` — password hashing and opaque session-token utilities.
- `auth.module.ts` — NestJS dependency wiring for the feature.
- `auth.service.spec.ts` — focused service behavior tests.

Platform administrators use the normal `/api/v1/auth/login` route and the same `users` account as workspace users. A separate `platform_admins` row grants platform-wide authorization; tenant owner/admin membership roles do not. Create the first grant for an existing active user with `pnpm --filter api admin:grant --email account@example.com`. There is no public admin registration or promotion route.

Admin routes are `GET /api/v1/admin/me`, `GET /api/v1/admin/overview`, `GET /api/v1/admin/tenants`, `GET /api/v1/admin/tenants/:id`, and `PATCH /api/v1/admin/tenants/:id`. The frontend paths are `/admin/login`, `/admin`, and `/admin/tenants`. Admin changes are logged with the operator identity and changed field names.

The auth feature is the module boundary. MVC stays inside that module: its controller, service, and repository are files beside the feature's validation, guard, and security code. The database schema is split by domain under `database/schema/`, with `index.ts` as the Drizzle export barrel. There is no separate tenant API module: signup creates the tenant as part of the same atomic auth operation, so a sibling tenants module would currently have no tenant-management behavior to own.

See the [root README](../../README.md) for the whole application architecture, local PostgreSQL setup, endpoint contract, migration workflow, and the difference between the Drizzle schema and SQL migrations.

From the repository root:

```bash
pnpm db:up
pnpm db:migrate
pnpm dev:api
```

Run `pnpm --filter api test:e2e` with the database running and migrated to exercise signup, login, current-user lookup, logout, validation, and password hashing through the HTTP layer. The e2e test deletes its temporary tenant after it completes.

Other database commands are `pnpm --filter api db:generate <module> [Drizzle Kit options]` and `pnpm --filter api db:check`. For example:

```bash
pnpm --filter api db:generate auth --name=auth_sessions_index
```

The API reads the root `.env`, verifies database connectivity during startup, and closes its pool during graceful shutdown.

Keep migrations in separate SQL files grouped under the owning module, for example `drizzle/tenants/`, `drizzle/auth/`, and `drizzle/admin/`. Keep each newly introduced table change in its own migration file. `scripts/generate-migration.mjs` runs Drizzle Kit, places the generated SQL in the requested module folder, and records that path in the journal. Drizzle Kit v0.31 reads these nested paths from one shared `meta/_journal.json`; its global index preserves the correct order when one module's tables reference another module's tables. The identity normalization migration stops before changing data if it finds duplicate case-insensitive emails, which must be consolidated manually first. The schema source is split by table, while migration SQL is grouped by owning module.
