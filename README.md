# Nexus

Nexus is a SaaS application being built as a practical software engineering project. It uses a pnpm monorepo and a modular monolith: one web app, one API process, and one PostgreSQL database. The architecture grows when product requirements create a real need.

## Application architecture

```text
Browser
  │ HTTPS / JSON (REST)
  ▼
apps/web — Next.js / React / TypeScript
  │ server requests or browser requests to the API
  ▼
apps/api — NestJS modular monolith
  ├── modules/v1/    versioned REST controllers, services, repositories
  ├── common/        API success and error response envelope
  ├── database/      PostgreSQL pool, Drizzle client, schema source
  └── Drizzle Kit    migration generation and application
  │
  ▼
PostgreSQL — local development via Docker Compose
```

The web app owns presentation, navigation, and browser interaction. It calls the API for product data; it must not connect directly to PostgreSQL. Keep feature-specific UI and data access near the feature. Shared client state is added only when a feature needs it. TanStack Query, Zustand, and shadcn/ui are intended choices as those needs arise; they are not all installed or required by the current starter UI.

The frontend follows feature ownership. `app/` contains Next route entry points and global CSS; route files stay thin and compose feature pages. `components/layout/` contains only shared presentation such as the site header, footer, and brand. `features/auth/`, `features/marketing/`, and `features/workspace/` own their UI and behavior. Inside auth, `api/client.ts` owns HTTP and API error parsing, `validation/schemas.ts` owns client validation, `hooks/use-auth-form.ts` owns form submission state and navigation, and `components/` owns the auth screens and controls. Server-only session lookup is in `features/auth/server-auth.ts`. This gives a developer one place to find each feature's UI, API calls, validation, and hooks.

The API owns HTTP boundaries, validation, authentication/authorization, business rules, and persistence. V1 currently groups API features under one `V1Module`; its one route prefix is configured globally in `main.ts` as `/api/v1`. Within V1, controllers handle HTTP, services implement use cases, and repositories own Drizzle queries and transactions. Add a feature module only when a real domain boundary warrants one. The API remains a single deployable application.

The request path is `HTTP → V1 controller → service → repository → Drizzle/PostgreSQL`. The global `APIResponseModule` wraps successful responses and formats errors consistently across API versions.

The database module owns the PostgreSQL connection pool and Drizzle client. Business modules use the typed Drizzle client for their persistence needs. Add a repository only when it creates a useful boundary for real complexity or multiple persistence implementations. The database is not a separate workspace package at this stage.

Current repository layout:

```text
Nexus/
├── apps/
│   ├── web/                         Next.js application
│   │   └── src/
│   │       ├── app/                 routes, layouts, global styles
│   │       ├── components/layout/   shared brand, header, and footer
│   │       └── features/
│   │           ├── auth/            auth API, validation, hook, and screens
│   │           ├── marketing/       public landing page sections
│   │           └── workspace/       authenticated shell and overview
│   └── api/                         NestJS application
│       ├── src/database/            PostgreSQL pool and Drizzle setup
│       │   └── schema/              tenant, user, and session definitions + barrel
│       ├── src/common/api-response/ shared response envelope + error filter
│       ├── src/modules/v1/auth/     auth feature: MVC, validation, context/security
│       ├── src/modules/v1/v1.module.ts
│       └── drizzle/                 module-grouped SQL migrations + global journal
├── infrastructure/docker-compose.yml
├── AGENTS.md                        Codex project instructions
├── .env.example                     local configuration template
└── pnpm-workspace.yaml              apps are current workspaces
```

There are no shared packages yet. Add one only when web and API have concrete code to share, such as stable API contracts. Keep any such package at `packages/<name>/package.json` and include it in `pnpm-workspace.yaml`.

## PostgreSQL, schema, and migrations

`apps/api/src/database/schema/index.ts` is the **schema source**. It declares the tables, columns, PostgreSQL types, nullability, defaults, relations, and constraints in TypeScript. Drizzle uses it to type-check application queries and Drizzle Kit reads it to calculate schema changes. It describes the database shape the current application expects; it does not by itself update a running database.

Files under `apps/api/drizzle/` are **migrations**. Each migration is an ordered, versioned SQL change from an earlier database state to a later one. Drizzle Kit applies those changes to the database and tracks which have run. Keep both schema source and migration history in version control: update the schema, generate a migration, review the SQL, and apply it. Do not edit an already-applied migration to change a deployed database; create a new migration. For a database that has never been initialized, the initial migration is its starting history.

The normalized domain keeps `users` as the sole identity and credential source. User email is normalized and globally unique. `memberships` connect a user to one or more tenants and own workspace roles; `invitations` grant memberships; `sessions` reference a user and may hold the currently selected membership. Session and invitation tokens are stored only as hashes. Signup atomically creates a tenant, user, owner membership, and session. Invitation acceptance atomically creates or reuses an identity, grants membership, accepts the invitation, and creates a session. Use the database's normal transaction isolation unless a demonstrated invariant needs stronger isolation.

Authentication routes are `/api/v1/auth/register`, `/api/v1/auth/login`, `/api/v1/auth/me`, `/api/v1/auth/logout`, `/api/v1/auth/select-workspace`, and `/api/v1/auth/invitations/:token/accept`. Signup creates the initial workspace owner. Login uses email and password; users with several memberships choose an active workspace after signing in. The API returns successful data inside `{ "success": true, "data": ... }`; errors use `{ "success": false, "error": { "code", "message", "details?", "requestId" } }`. Session tokens are held in an HttpOnly, SameSite=Strict cookie and are never returned in JSON. Passwords are hashed using Node's scrypt implementation. The web app proxies `/api/v1/*` to the API so the browser can use a same-origin session cookie.

There is no standalone tenant API module yet. A tenant currently exists as a database entity created atomically with its owner during signup. Add tenant routes/services inside V1 only when tenant management becomes a product feature; the `tenants` table is defined in the database schema and is not an authentication identity store.

The pool is a Nest provider, which is singleton-scoped by default within this API process. It checks connectivity at startup and closes on application shutdown. Every API instance/process has its own pool; this is a per-process lifecycle, not a cross-process singleton.

## SOLID and database correctness

Apply SOLID where it improves the code, without adding layers just to satisfy a pattern:

- **Single Responsibility:** controllers handle HTTP, services handle a business operation, and the database module owns connection setup. Keep each reason to change clear.
- **Open/Closed:** extend a capability through focused code changes; do not build plugin systems or generic frameworks before variation exists.
- **Liskov Substitution:** when implementations are substituted, preserve the behavior callers rely on. Do not add interfaces where there is only one implementation and no meaningful seam.
- **Interface Segregation:** keep module APIs small and purpose-specific; avoid broad service interfaces clients do not need.
- **Dependency Inversion:** Nest injects the database service into the feature service. Introduce a persistence interface only when there is a real need to decouple implementations or tests.

Use ACID transactions when several database changes must be atomic. Let PostgreSQL enforce durable invariants with constraints, use foreign keys for relationships, and use appropriate unique constraints and indexes. Transactions do not replace validation or constraints; validation gives useful errors, while database constraints protect data against concurrent requests and other writers. Handle expected constraint conflicts as safe application errors without returning database internals.

## Local development

1. Install dependencies with `pnpm install`.
2. Copy `.env.example` to `.env` and adjust local values if needed.
3. Start PostgreSQL and pgAdmin with `pnpm db:up` (Docker Desktop or Docker Engine must be installed and running; the command waits for PostgreSQL to become healthy).
4. Apply committed migrations with `pnpm db:migrate`.
5. Start the API with `pnpm dev:api` and the web app with `pnpm dev:web`.

Open [http://localhost:5050](http://localhost:5050) to access pgAdmin. Sign in with `PGADMIN_DEFAULT_EMAIL` and `PGADMIN_DEFAULT_PASSWORD` from the root `.env` (the example values are `admin@nexus.com` and `nexus-dev`). Register a server using host `postgres`, port `5432`, database `nexus`, and the `POSTGRES_USER` / `POSTGRES_PASSWORD` from `.env`. Use `postgres` as the host from another Compose container; applications running directly on your computer connect to `localhost:5432`.

Generate a migration after changing the schema with `pnpm --filter api db:generate`, inspect the generated SQL, then apply it with `pnpm --filter api db:migrate`. `pnpm --filter api db:check` checks migration consistency. The real `.env` is ignored by Git; only share `.env.example` with safe placeholders.

## Current state

The repository contains a responsive public site, signup/sign-in screens, a protected workspace overview, a V1 authentication API, tenant-aware user identities, hashed server-side sessions, shared API success/error responses, PostgreSQL/Drizzle setup, and migrations for tenant, user, and auth-session data. Password recovery, email verification, team invitations, and product modules are not wired yet because they require additional mail and product flows.

See [AGENTS.md](./AGENTS.md) for implementation guidelines Codex should follow in this repository.
