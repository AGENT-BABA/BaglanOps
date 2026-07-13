# NetOps — ISP Dealer Maintenance & Monitoring Portal

Full-stack portal for ISPs to manage dealers, workers, clients, routers, and support tickets with real-time router health monitoring.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.11+, FastAPI, Motor (async MongoDB) |
| Frontend | React 19, Tailwind CSS, shadcn/ui, Leaflet maps |
| Database | MongoDB (Atlas or local) |
| Auth | JWT (HS256), bcrypt password hashing |
| Router Monitoring | TP-Link API (`tplinkrouterc6u`), async ping fallback |

## Architecture

```
4-role hierarchy:  Admin → Dealer → Worker → Client

backend/
  server.py           # FastAPI app — all routes, models, seed data
  router_monitor.py   # Async health checks, ping, TP-Link integration
  .env                # Config (not committed)

frontend/src/
  pages/              # 17 page components (Admin*, Dealer*, Worker*, User*)
  components/         # Reusable UI (MapPicker, ErrorBoundary, NotifyToggle, etc.)
  context/            # AuthContext, ThemeContext
  lib/                # api.js (axios), routerDetect.js (auto-detect)
```

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- MongoDB (local or Atlas connection string)

### Backend

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Create .env file
cat > .env << EOF
MONGO_URL=mongodb://localhost:27017
DB_NAME=netops
JWT_SECRET=your-secret-here
ADMIN_EMAIL=admin@netops.in
ADMIN_PASSWORD=your-admin-password
CORS_ORIGINS=http://localhost:3000
EOF

# Start server (port 8000)
python -m uvicorn server:app --host 0.0.0.0 --port 8000 --reload
```

On first run, the server auto-seeds an admin user from `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

### Frontend

```bash
cd frontend

# Install dependencies
yarn install

# Create .env
echo "REACT_APP_BACKEND_URL=http://localhost:8000" > .env

# Start dev server (port 3000)
yarn start
```

## Features

### Admin
- Overview dashboard with KPIs (dealers, workers, clients, tickets, routers)
- Dealer management — create, view workers, ticket counts
- Client-dealer assignment
- Health monitoring — all routers, status breakdown, issue trends

### Dealer
- Territory overview — clients, workers, open tickets
- Ticket queue — assign/reassign workers, view nearby workers on map
- Worker management — add workers with service area
- Router health dashboard — live status, signal, WAN, device counts

### Worker
- Task list — assigned tickets with status updates, navigation links

### Client
- Dashboard — router status, signal, WAN connectivity
- Ticket submission — report issues with type and description
- Ticket history — view, delete with reason

### Router Monitoring
- Health checks every 10 minutes (configurable)
- TP-Link routers: full status (signal, devices, CPU, memory, WAN)
- Generic routers: ping-based reachability + signal estimation from latency
- Smart logging — only records status changes, signal swings, error changes
- Auto-cleanup of health logs older than 30 days
- Concurrent checks (up to 50 parallel) with async pings
- Notifications on status changes (online/offline/degraded)

## API Endpoints

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | Login (rate-limited: 5/min) |
| POST | `/api/auth/register` | Register client/worker (rate-limited: 3/min) |

### Admin
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/overview` | Dashboard KPIs |
| GET | `/api/admin/dealers` | List all dealers |
| GET | `/api/admin/dealers/{id}/workers` | Dealers workers |
| GET | `/api/admin/clients` | List all clients |
| POST | `/api/admin/clients/assign` | Assign client to dealer |
| GET | `/api/admin/health` | All router health data |
| GET | `/api/admin/analytics` | Issue trends, resolution times |

### Dealer
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/dealer/overview` | Territory KPIs |
| GET | `/api/dealer/tickets` | Ticket queue (filterable) |
| GET | `/api/dealer/tickets/{id}/nearby-workers` | Workers near a ticket |
| POST | `/api/dealer/tickets/{id}/assign` | Assign ticket to worker |
| GET | `/api/dealer/workers` | List workers |
| POST | `/api/dealer/workers` | Create worker |
| GET | `/api/dealer/clients` | List clients |
| GET | `/api/dealer/health` | Dealer's router health |

### Worker
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/worker/tasks` | Assigned tickets |
| PUT | `/api/worker/tickets/{id}/status` | Update ticket status |

### Client
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/user/dashboard` | Dashboard data |
| POST | `/api/user/tickets` | Create ticket |
| GET | `/api/user/tickets` | List my tickets |
| DELETE | `/api/user/tickets/{id}` | Delete ticket with reason |
| GET | `/api/user/routers` | List my routers |
| POST | `/api/user/routers/register` | Register existing router |
| POST | `/api/user/routers` | Create new router |

### Health
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health/check/{router_id}` | On-demand health check |
| POST | `/api/health/check/{router_id}` | Trigger health check |
| GET | `/api/health/logs/{router_id}` | Router health history |

## Role-Based Access

| Route | Admin | Dealer | Worker | Client |
|-------|-------|--------|--------|--------|
| `/admin/*` | Yes | - | - | - |
| `/dealer/*` | - | Yes | - | - |
| `/worker/*` | - | - | Yes | - |
| `/user/*` | - | - | - | Yes |

Protected routes redirect to the correct home if a user visits the wrong role's page.

## Key Design Decisions

- **Swiss-brutalist UI** — monospace labels, tight spacing, high-contrast cards
- **Map picker** — Maharashtra-bounded with satellite toggle (ESRI tiles, no API key)
- **Auto-generated router IDs** — format `RTR-{8 hex chars}`, server-side generation
- **Signal estimation** — non-TP-Link routers estimate signal from ping latency
- **WAN check** — pings `8.8.8.8` (not own WAN IP, since NAT blocks self-pings)
- **Smart health logging** — only writes when status changes, signal swings >20%, or error changes
- **No simulation** — all monitoring is real (ping/API based)

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGO_URL` | Yes | MongoDB connection string |
| `DB_NAME` | Yes | Database name |
| `JWT_SECRET` | Yes | Secret for JWT signing (min 32 chars) |
| `ADMIN_EMAIL` | Yes | Seed admin email |
| `ADMIN_PASSWORD` | Yes | Seed admin password |
| `CORS_ORIGINS` | No | Comma-separated allowed origins (default: `*`) |
| `REACT_APP_BACKEND_URL` | Yes | Backend URL for frontend (e.g. `http://localhost:8000`) |
