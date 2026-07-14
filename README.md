# NetOps — ISP Dealer Maintenance & Monitoring Portal

Full-stack portal for ISPs to manage dealers, workers, clients, and PPPoE connections with real-time monitoring via MikroTik RouterOS API.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.11+, FastAPI, Motor (async MongoDB) |
| Frontend | React 19, Tailwind CSS, shadcn/ui, Leaflet maps |
| Database | MongoDB (Atlas or local) |
| Auth | JWT (HS256), bcrypt password hashing |
| Router Integration | MikroTik RouterOS API (`routeros-api`) |
| Monitoring | PPPoE session checks via MikroTik, async ping fallback |
| Reports | Daily aggregation, monthly PDF export (`reportlab`) |
| Encryption | Fernet symmetric encryption for stored secrets |

## Architecture

```
4-role hierarchy:  Admin → Dealer → Worker → Client

backend/
  server.py           # FastAPI app — all routes, models, seed data
  mikrotik.py         # MikroTik RouterOS API wrapper (PPPoE, profiles, queues)
  router_monitor.py   # Health checks — PPPoE session status + ping fallback
  .env                # Config (not committed)

frontend/src/
  pages/              # Page components (Admin*, Dealer*, Worker*, User*)
  components/         # UI components (MapPicker, ErrorBoundary, SpeedTest, etc.)
  context/            # AuthContext, ThemeContext
  lib/                # api.js (axios instance with interceptors)
```

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- MongoDB (local or Atlas connection string)

### Backend

```bash
# From project root
pip install -r backend/requirements.txt

# Create backend/.env
cat > backend/.env << EOF
MONGO_URL=mongodb://localhost:27017
DB_NAME=netops
JWT_SECRET=your-secret-here-min-32-chars
ADMIN_EMAIL=admin@netops.in
ADMIN_PASSWORD=your-admin-password
CORS_ORIGINS=http://localhost:3000
ENCRYPTION_KEY=your-fernet-key
EOF

# Start server (port 8000)
python -m uvicorn backend.server:app --host 0.0.0.0 --port 8000 --reload
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
- Overview dashboard with KPIs (dealers, workers, clients, tickets, PPPoE sessions)
- Dealer management — create, view workers, ticket counts
- Client management — assign to dealers, assign PPPoE routers from MikroTik
- PPPoE user assignment — pick from live MikroTik CCR users, auto-link to clients
- Health monitoring dashboard — all connections, status breakdown
- Daily health reports with filtering
- Monthly PDF report export
- MikroTik CCR configuration — connect once, manage all PPPoE users

### Dealer
- Territory overview — clients, workers, open tickets
- Ticket queue — assign/reassign workers, view nearby workers on map
- Worker management — add workers with service area
- Router health dashboard — live status for all assigned connections

### Worker
- Task list — assigned tickets with status updates, navigation links

### Client
- Dashboard — PPPoE connection details (username, profile, IP, status, uptime, usage)
- Speed test — test download/upload speed and latency on demand
- Ticket submission — report issues with type and description
- Ticket history — view, delete with reason

### PPPoE-Based Monitoring
- Health checks every 10 minutes via MikroTik API
- PPPoE session status — online/offline detection
- Live data — IP, uptime, data usage (bytes in/out)
- Status change notifications (online → offline)
- Automatic wire cut detection (PPPoE session drops)
- Smart logging — only records meaningful status changes
- Auto-cleanup of health logs older than 30 days

### Speed Test
- Latency measurement (10 pings, average)
- Download speed test (10MB file from backend)
- Upload speed test (10MB file to backend)
- Results in Mbps with visual progress bar

## API Endpoints

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | Login (rate-limited: 5/min) |
| POST | `/api/auth/register` | Register client/worker (rate-limited: 3/min) |
| GET | `/api/auth/me` | Get current user |

### Admin
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/analytics` | Dashboard KPIs per dealer |
| GET | `/api/admin/system-stats` | System-wide stats (incl. PPPoE sessions) |
| GET | `/api/admin/dealers` | List all dealers |
| POST | `/api/admin/dealers` | Create dealer |
| DELETE | `/api/admin/dealers/{id}` | Delete dealer (cascade) |
| GET | `/api/admin/dealers/{id}/workers` | Dealer's workers |
| GET | `/api/admin/clients/all` | List ALL clients with router status |
| GET | `/api/admin/clients/unassigned` | Unassigned clients |
| POST | `/api/admin/clients/{id}/assign-dealer` | Assign client to dealer |
| GET | `/api/admin/pppoe-users` | PPPoE users from MikroTik (with assignment status) |
| POST | `/api/admin/assign-router/confirm` | Assign PPPoE user to client |
| DELETE | `/api/admin/unassign-router/{id}` | Remove PPPoE assignment |
| GET | `/api/admin/daily-reports` | Daily health reports |
| GET | `/api/admin/reports/monthly` | Monthly aggregated summary |
| GET | `/api/admin/reports/monthly/pdf` | Download monthly PDF report |
| DELETE | `/api/admin/reports/monthly` | Delete monthly reports |
| GET | `/api/admin/audit-logs` | Audit log entries |

### MikroTik Integration
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/admin/mikrotik/config` | Save MikroTik CCR connection |
| GET | `/api/admin/mikrotik/config` | Get config (password masked) |
| GET | `/api/admin/mikrotik/test` | Test MikroTik connection |
| GET | `/api/admin/mikrotik/sessions` | Active PPPoE sessions |
| GET | `/api/admin/mikrotik/secrets` | All PPPoE users |
| GET | `/api/admin/mikrotik/profiles` | PPPoE profiles |
| GET | `/api/admin/mikrotik/interfaces` | Interfaces with traffic |
| GET | `/api/admin/mikrotik/queues` | Simple queues (bandwidth) |
| POST | `/api/admin/mikrotik/disconnect/{id}` | Disconnect PPPoE session |
| POST | `/api/admin/mikrotik/toggle-user/{id}` | Enable/disable PPPoE user |
| POST | `/api/admin/mikrotik/change-profile/{id}` | Change PPPoE profile |

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
| POST | `/api/dealer/clients` | Create client |
| GET | `/api/dealer/routers/health/summary` | All routers health |

### Worker
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/worker/tasks` | Assigned tickets |
| POST | `/api/worker/tasks/{id}/start` | Start working on ticket |
| POST | `/api/worker/tasks/{id}/complete` | Mark ticket resolved |

### Client
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/user/routers` | My connection (live PPPoE status) |
| POST | `/api/user/report-issue` | Report connection issue |
| GET | `/api/user/tickets` | My tickets |
| POST | `/api/user/tickets/{id}/feedback` | Submit feedback |
| DELETE | `/api/user/tickets/{id}` | Delete ticket with reason |

### Speed Test
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/speedtest/ping` | Latency measurement endpoint |
| GET | `/api/speedtest/test-file/{size}` | Download test file (1/10/50 MB) |
| POST | `/api/speedtest/upload` | Upload test endpoint |

### Notifications
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/notifications` | Get notifications |
| POST | `/api/notifications/{id}/read` | Mark as read |

## Role-Based Access

| Route | Admin | Dealer | Worker | Client |
|-------|-------|--------|--------|--------|
| `/admin/*` | Yes | - | - | - |
| `/dealer/*` | - | Yes | - | - |
| `/worker/*` | - | - | Yes | - |
| `/user/*` | - | - | - | Yes |

Protected routes redirect to the correct home if a user visits the wrong role's page.

## Key Design Decisions

- **PPPoE-based assignment** — admin assigns MikroTik PPPoE users to clients, no manual router setup needed
- **Swiss-brutalist UI** — monospace labels, tight spacing, high-contrast cards
- **Map picker** — Maharashtra-bounded with satellite toggle (ESRI tiles, no API key)
- **Auto-generated router IDs** — format `RTR-{8 hex chars}`, server-side generation
- **Encrypted secrets** — MikroTik passwords stored with Fernet encryption
- **Smart health logging** — only writes when status changes or stale breadcrumbs
- **Concurrent checks** — up to 50 parallel health checks via asyncio semaphore
- **No simulation** — all monitoring is real (MikroTik API / ping based)

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGO_URL` | Yes | MongoDB connection string |
| `DB_NAME` | Yes | Database name |
| `JWT_SECRET` | Yes | Secret for JWT signing (min 32 chars) |
| `ADMIN_EMAIL` | Yes | Seed admin email |
| `ADMIN_PASSWORD` | Yes | Seed admin password |
| `ENCRYPTION_KEY` | Yes | Fernet key for encrypting stored secrets |
| `CORS_ORIGINS` | No | Comma-separated allowed origins (default: `http://localhost:3000`) |
| `REACT_APP_BACKEND_URL` | Yes | Backend URL for frontend (e.g. `http://localhost:8000`) |

## Deployment

### Backend (Render)
- Build: `pip install -r backend/requirements.txt`
- Start: `uvicorn backend.server:app --host 0.0.0.0 --port $PORT`
- Set all env vars in Render dashboard
- Set `CORS_ORIGINS` to your Vercel frontend URL

### Frontend (Vercel)
- Root directory: `frontend`
- Build command: `CI=false npx craco build`
- Output directory: `build`
- Env: `REACT_APP_BACKEND_URL`, `CI=false`

### Database (MongoDB Atlas)
- Free tier (512 MB) is sufficient
- Connection string goes in `MONGO_URL`
