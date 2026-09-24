# Nexus Web

The Next.js application owns the public site, authentication screens, and protected workspace interface. It communicates with the API through a same-origin rewrite for `/api/v1/*`; the browser never connects directly to PostgreSQL.

Frontend ownership is by feature. Route entry points in `src/app/` stay thin. Cross-feature presentation lives in `src/components/layout/`; product UI lives in `src/features/`:

- `auth/api/client.ts`: same-origin API requests and safe API error parsing.
- `auth/validation/schemas.ts`: signup/login client validation.
- `auth/hooks/use-auth-form.ts`: form state, submit lifecycle, and navigation.
- `auth/components/`: auth page, separate forms, field controls, and sign-out control.
- `auth/server-auth.ts`: server-side current-user lookup for protected routes.
- `marketing/components/`: public landing page and its sections/preview.
- `workspace/components/`: authenticated application shell and overview.

See the [root README](../../README.md) for the complete application architecture, sign-in/session behavior, and local development setup. Run `pnpm dev:web` from the repository root to start the web app.
