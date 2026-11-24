# MallMind AI — Frontend (Phase 10)

React 19 + TypeScript + Vite, React Router for pages, no UI framework --
plain CSS using the same validated palette tokens as the admin dashboard
(`backend/src/main/resources/static/admin-dashboard.html`) for visual
consistency. No mocked data anywhere: every page calls the real Java
backend (and, through it, the Python model-service) over HTTP.

## Setup

```powershell
cd frontend
npm install
npm run dev
```

Opens on `http://localhost:5173`. Vite's dev-server proxies `/api/**` to
`http://localhost:8080` (see `vite.config.ts`), so the backend must
already be running (see root `PROGRESS.md` for the full startup sequence:
Postgres → backend → seed data → model-service → frontend).

## What's here

- `src/api/` — `types.ts` (TypeScript mirrors of the backend's Java
  record DTOs) and `client.ts` (a thin fetch wrapper that attaches the
  JWT and normalizes error responses).
- `src/auth/` — `AuthContext` (login/register/logout, JWT in
  `localStorage`) and `CartContext` (the nav bar's live cart badge).
- `src/components/` — `Layout` (role-aware nav bar), `ProductCard`,
  `VoiceWidget` (the floating voice assistant panel, with real browser
  microphone recording via `MediaRecorder`).
- `src/pages/` — one file per route; see `App.tsx` for the route table
  and which ones require auth (`RequireAuth`) or a retailer/admin role
  (`RequireRetailer`).

## Known limitations

- No mall-layout *editor* UI — an admin still edits the navigation graph
  via the database/seed scripts, not a page in this app.
- Voice widget sessions, and the JWT itself, don't survive if the
  model-service or backend restarts mid-conversation — same documented
  limitation as the backend's own `VoiceSessionService`.
