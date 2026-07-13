# NetOps — ISP Dealer Maintenance Portal

## Original Problem Statement
Website for an ISP dealer that:
1. Detects router issues automatically (wire-cuts, signal loss, outages) and notifies the dealer with router + location.
2. Detects "internet not working" issues even without a wire cut and auto-notifies dealer.
3. Provides logins for both users (clients) and admins so clients can track their issue status.
4. On restoration, client gets a notification and submits feedback (working / not-working with reason). Feedback is delivered back to the dealer.
5. Demo login required for admin + user. Must scale for 2,000+ clients. Beautiful, professional UI with light + dark mode. Fully responsive.

**Iteration 2 — user pivot**: workflow expanded to a 4-role hierarchy:
> Admin (oversees all dealers, analytics) → Dealer (assigns workers) → Worker/Maintenance Team (executes at client site) → User/Client (reports, confirms).

## Architecture
- **Backend**: FastAPI (`/app/backend/server.py`) + MongoDB (motor)
- **Frontend**: React 19 + React Router 7 + Tailwind + shadcn/ui + Recharts
- **Auth**: JWT (HS256) bearer tokens in `Authorization` header, stored client-side in `localStorage` under `netops_token`. Passwords hashed with bcrypt.
- **Fonts**: Outfit (display) + IBM Plex Sans (body) + IBM Plex Mono (mono). Corporate/Swiss brutalist aesthetic. Light + dark mode.
- **Nearest-worker matching**: Haversine distance on backend (lat/lng), workers returned sorted ascending distance + secondary sort by active job count.

## Roles & Access
| Role | Home | Powers |
|---|---|---|
| Admin | `/admin` | System-wide analytics, per-dealer resolve rates, per-area ticket volumes, dealer creation |
| Dealer | `/dealer` | Own KPIs, ticket queue with worker assignment (nearest-first), simulate incidents, manage workers + clients, dealer code |
| Worker | `/worker` | View assigned tasks with client address + Google Maps deep-link, Start / Complete flow |
| User (Client) | `/user` | See own routers, report issues, receive restoration alerts, submit feedback |

## User Personas
- **Vikram (Admin)** — HQ operations lead; oversees resolve rates across 4 cities.
- **NetOps Nashik Dealer** — Small business dealer, dispatches 5 workers to 40 clients.
- **Priya (Worker)** — Field technician; needs address + fastest route.
- **Ananya (Client)** — Consumer; wants a working connection and updates.

## Seed dataset (auto on startup)
- 1 Admin (`admin@netops.io / admin123`)
- 4 Dealers: Nashik (`NSK-A1`), Pune (`PUN-B2`), Mumbai (`MUM-C3`), Bengaluru (`BLR-D4`) — password `dealer123`
- 5 Workers per dealer = 20 workers total, each with lat/lng near their service area (`worker.<city><n>@netops.io / worker123`)
- 40 Clients per dealer = 160 clients (`client.<city><n>@netops.io / client123`); demo client `user@netops.io / user123`
- Routers auto-provisioned 1:1 with clients (~85% online, ~10% degraded, ~5% offline)
- Tickets pre-seeded for offline/degraded routers

## What's Implemented (as of 2026-07-12)
- Auth: login, client-only public register with dealer code, /me, role-based route guards.
- Admin: system stats, per-dealer analytics (resolve rate, avg MTTR), area analytics, dealers CRUD.
- Dealer: overview KPIs, ticket queue, nearest-worker assignment modal with Google Maps deep-link, worker create, client create (auto-provisions router), simulate incidents.
- Worker: assigned tasks list with Start/Complete buttons, notifications to client + dealer on completion.
- Client: routers view, manual report issue, tickets history, feedback flow (working/not-working with reason). Not-working feedback reopens ticket + notifies dealer.
- Shared: real-time in-app notification bell (polling every 10-15s), theme toggle (dark/light) with localStorage persistence, sonner toasts.
- Design: Corporate Swiss-brutalist, `data-testid` on every interactive element, responsive (mobile → desktop), no `transition-all`, dark-mode grain overlay, glass sticky headers.

## Prioritized Backlog
### P0 (deferred but ready to add)
- **SendGrid email** notifications on ticket assignment, restoration, feedback (API key already stored in `/app/backend/.env` as `SENDGRID_API_KEY`; needs `SENDGRID_FROM_EMAIL` set to a verified sender).
- **Twilio SMS** notifications for restoration alerts (optional).

### P1
- Interactive **map view** (react-leaflet + OpenStreetMap) showing worker positions & ticket pins.
- **Worker mobile-first UI** refinements (bigger tap targets, offline-safe photo upload before/after fix).
- Charts for admin: daily ticket trend line, city heat-map.
- Dealer bulk-import clients from CSV.

### P2
- Push notifications via web push (VAPID).
- Ticket comments/chat thread between dealer↔worker↔client.
- SLA breach alerts (avg MTTR > threshold → escalate to admin).
- WhatsApp Business API integration.

## Deferred technical items
- Rate-limiting middleware (mentioned in brief) — not yet applied; can be added via `slowapi` on auth endpoints.
- Redis cache layer for the admin analytics endpoint at scale.
- Full test suite: 23/23 backend pytest passing; add front-end Playwright suite in CI.

## Test credentials
See `/app/memory/test_credentials.md`.
