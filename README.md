# 🚀 ReachInbox Email Scheduler (Full-Stack Monorepo)

A production-grade, distributed email scheduling service and real-time dashboard built with **Express, TypeScript, BullMQ, Redis, PostgreSQL (Prisma), Elasticsearch, Nodemailer (Ethereal), Next.js 14, Tailwind CSS, Google OAuth, and Slack OAuth**.

---

## 📑 Table of Contents
1. [Architecture & System Flow](#-architecture--system-flow)
2. [Monorepo Directory Structure](#-monorepo-directory-structure)
3. [Core Scheduling & Idempotency Mechanics](#-core-scheduling--idempotency-mechanics)
4. [Restart Survival & Boot-Time Reconciliation](#-restart-survival--boot-time-reconciliation)
5. [Rate Limiting & Slack Notification Flow](#-rate-limiting--slack-notification-flow)
6. [Elasticsearch Search Integration](#-elasticsearch-search-integration)
7. [Getting Started & Setup](#-getting-started--setup)
8. [Environment Variables Reference](#-environment-variables-reference)
9. [Feature Checklist](#-feature-checklist)
10. [Assumptions & Design Decisions](#-assumptions--design-decisions)

---

## 🏛 Architecture & System Flow

```mermaid
flowchart TD
    subgraph Client ["Frontend (Next.js 14 + Tailwind)"]
        UI[Dashboard / Compose Modal]
        CSV[CSV / TXT Parser]
        SearchUI[Elasticsearch Search Modal]
    end

    subgraph API ["Backend API (Express + TypeScript)"]
        Auth[Passport Google OAuth + JWT]
        SlackAuth[Slack OAuth v2]
        Router[Email Scheduler Routes]
        Reconcile[Boot Reconciliation Engine]
    end

    subgraph Storage ["Datastores & Infra"]
        PG[(PostgreSQL - Primary Source of Truth)]
        Redis[(Redis - BullMQ & Rate Limit Counters)]
        ES[(Elasticsearch - Full-Text Index)]
        BullQueue[BullMQ Delayed Queue]
    end

    subgraph Worker ["Worker Subsystem"]
        BW[BullMQ Worker Pool]
        Idempotency[Idempotency Guard]
        RateLimiter[Redis Rate Limit Check]
        Mailer[Nodemailer / Ethereal SMTP]
        SlackAlert[Slack Webhook / API Alert]
    end

    UI -->|1. POST /emails/schedule| Router
    Router -->|2. Insert status=SCHEDULED| PG
    Router -->|3. Add delayed job| BullQueue
    Router -->|4. Index doc| ES
    BullQueue -->|Pushed to Redis| Redis

    BW -->|5. Fetch Job on Delay Expiry| BullQueue
    BW -->|6. Check Status != SENT| Idempotency
    Idempotency -->|Query| PG
    BW -->|7. INCR ratelimit key| RateLimiter
    RateLimiter -->|If Cap Hit| SlackAlert
    RateLimiter -->|If Cap Hit: moveToDelayed| BullQueue
    RateLimiter -->|If Allowed: Send| Mailer
    Mailer -->|8. UPDATE status=SENT| PG
    Mailer -->|9. Update Index| ES

    Reconcile -->|On Boot: Check DB vs Queue| PG
    Reconcile -->|Re-enqueue missing jobs| BullQueue

    SearchUI -->|GET /emails/search?q=| ES
```

---

## 📂 Monorepo Directory Structure

```
Email_Scheduler/
├── docker-compose.yml              # Redis (6379), Postgres (5432), Elasticsearch (9200)
├── README.md                       # Comprehensive system documentation
│
├── backend/
│   ├── prisma/
│   │   └── schema.prisma           # User, Sender, Email, SlackConnection models
│   ├── src/
│   │   ├── auth/
│   │   │   ├── google.strategy.ts  # Passport Google OAuth strategy
│   │   │   └── jwt.middleware.ts   # JWT verify & Express.User typing
│   │   ├── db/
│   │   │   └── prisma.ts           # Singleton Prisma client
│   │   ├── queue/
│   │   │   ├── queue.ts            # BullMQ Queue instance & config
│   │   │   ├── worker.ts           # BullMQ Worker (Idempotency, Rate Limiting, Nodemailer)
│   │   │   └── reconcile.ts        # Boot-time DB vs Queue reconciliation
│   │   ├── routes/
│   │   │   ├── auth.routes.ts      # /auth/google, /auth/me, /auth/dev-login
│   │   │   ├── email.routes.ts     # /emails/schedule, /emails, /emails/search, /emails/:id
│   │   │   ├── sender.routes.ts    # /senders (CRUD)
│   │   │   └── slack.routes.ts     # /slack/connect, /slack/callback, /slack/status
│   │   ├── services/
│   │   │   ├── elasticsearch.service.ts # Indexing and fuzzy full-text search
│   │   │   ├── mailer.service.ts   # Nodemailer with automatic Ethereal preview
│   │   │   └── slack.service.ts    # Live DB token lookup + Slack notification
│   │   ├── app.ts                  # Express app + Bull Board (/admin/queues)
│   │   ├── config.ts               # Zod validated configuration
│   │   ├── redis.ts                # ioredis client & atomic rate limit helpers
│   │   └── server.ts               # Entry point & graceful shutdown
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── auth/callback/      # OAuth token handler
    │   │   ├── dashboard/          # Metrics, Scheduled & Sent tabs
    │   │   ├── globals.css         # Custom typography & glassmorphism
    │   │   ├── layout.tsx          # TanStack Query & Sonner providers
    │   │   └── page.tsx            # Modern Login Hero (Google OAuth + Demo)
    │   ├── components/
    │   │   ├── ui/                 # Button, Input, Modal, Badge, Skeleton
    │   │   ├── ComposeModal.tsx    # Campaign composer + CSV drag/drop parser
    │   │   ├── EmailTable.tsx      # Paginated table + job details modal
    │   │   ├── Header.tsx          # Search bar, Bull Board link, user menu
    │   │   ├── SearchModal.tsx     # Elasticsearch search modal
    │   │   └── SlackConnect.tsx    # Slack OAuth status badge
    │   ├── lib/
    │   │   ├── api.ts              # Axios client with JWT interceptor
    │   │   └── queryClient.ts      # React Query config
    │   └── types/
    │       └── api.ts              # Shared TypeScript interfaces
    ├── .env.example
    ├── package.json
    ├── tailwind.config.ts
    └── tsconfig.json
```

---

## 🔒 Core Scheduling & Idempotency Mechanics

1. **Pure BullMQ Delayed Jobs (Zero Cron)**:
   - Scheduling calculates remaining delay: `delay = max(0, scheduledAt.getTime() - Date.now())`.
   - BullMQ handles high-precision scheduling using Redis sorted sets (`zadd`/`zrangebyscore`) without polling loops or `node-cron`.

2. **Idempotency Enforcement**:
   - Each email has a cryptographic idempotency key:
     `idempotencyKey = SHA256(userId + senderId + recipient + subject + scheduledAt)`.
   - The job is persisted into **PostgreSQL first** with a unique constraint on `idempotencyKey`.
   - When the worker picks up a job, it executes a fresh `findUnique` query:
     - If `status === "SENT"`, the worker exits immediately to prevent duplicate sends under worker replay/reconnect.
     - If `status === "CANCELLED"`, the email is safely discarded.

---

## 🔄 Restart Survival & Boot-Time Reconciliation

When the server or worker crashes or restarts:
1. BullMQ persists queued jobs in Redis, but in case of Redis flushes or cold server boots, the `reconcile()` function runs automatically in `server.ts`.
2. `reconcile()` queries Postgres for all emails with `status IN ('SCHEDULED', 'PENDING')`.
3. For each record, it inspects BullMQ via `emailQueue.getJob(bullJobId)`.
4. If no active/delayed job is found, it re-enqueues the job with `delay = max(0, scheduledAt - now)` and updates the `bullJobId` in PostgreSQL.

---

## ⚡ Rate Limiting & Slack Notification Flow

1. **Sender-scoped Min Delay**:
   - BullMQ worker is configured with `limiter: { max: 1, duration: MIN_DELAY_MS }`.
2. **Hourly Rate Limit Counter**:
   - Redis counter key: `ratelimit:{senderAddress}:{YYYY-MM-DDTHH}`.
   - Worker checks `getCurrentRateLimit(sender) >= MAX_EMAILS_PER_HOUR`.
   - **Non-failing rescheduling**: If limit is hit, the worker pushes the job to the start of the next hour using `job.moveToDelayed(nextHourMs)`.
   - **Slack Alert**: Worker queries `SlackConnection` directly from Postgres (no boot caching) and immediately posts an alert to the user's Slack webhook/channel with the resumption timestamp.

---

## 🔍 Elasticsearch Search Integration

- On creation and status transitions (`SCHEDULED` ➡️ `SENT` / `FAILED`), emails are indexed into Elasticsearch (`emails` index).
- Full-text search endpoint `GET /emails/search?q=` performs multi-match fuzzy queries on `subject^3`, `recipient^2`, `body`, and `sender`.
- Automatic fallback: If Elasticsearch is temporarily unreachable, the endpoint automatically falls back to Postgres case-insensitive ILIKE search.

---

## 🚀 Getting Started & Setup

### Prerequisites
- [Docker & Docker Compose](https://www.docker.com/)
- [Node.js 18+ & npm](https://nodejs.org/)

### 1. Start Infrastructure
```bash
docker compose up -d
```
This boots:
- **Redis**: `localhost:6379`
- **PostgreSQL**: `localhost:5432` (User: `reachinbox`, Pass: `reachinbox_secret`, DB: `reachinbox`)
- **Elasticsearch**: `localhost:9200`

### 2. Configure Environment Files

**Backend** (`backend/.env`):
```bash
cp backend/.env.example backend/.env
```
*(Fill in `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `SLACK_CLIENT_ID`, `SLACK_CLIENT_SECRET` when ready. If left blank, you can use the instant **Demo Login** on the login page).*

**Frontend** (`frontend/.env.local`):
```bash
cp frontend/.env.example frontend/.env.local
```

### 3. Run Database Migrations
```bash
cd backend
npx prisma db push
```

### 4. Start Development Servers

In terminal 1 (Backend):
```bash
cd backend
npm run dev
```

In terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```

- **Frontend App**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:4000](http://localhost:4000)
- **Bull Board Queue UI**: [http://localhost:4000/admin/queues](http://localhost:4000/admin/queues)
- **Health Check**: [http://localhost:4000/health](http://localhost:4000/health)

---

## ⚙️ Environment Variables Reference

### Backend (`/backend/.env`)
| Variable | Description | Default |
|---|---|---|
| `PORT` | API server port | `4000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://reachinbox:reachinbox_secret@localhost:5432/reachinbox` |
| `REDIS_HOST` | Redis host | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `ELASTICSEARCH_URL` | Elasticsearch cluster endpoint | `http://localhost:9200` |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | Required for Google Auth |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | Required for Google Auth |
| `GOOGLE_CALLBACK_URL` | Google OAuth redirect URL | `http://localhost:4000/auth/google/callback` |
| `JWT_SECRET` | Secret for signing auth tokens | 64+ char string |
| `SLACK_CLIENT_ID` | Slack App Client ID | Required for Slack OAuth |
| `SLACK_CLIENT_SECRET` | Slack App Client Secret | Required for Slack OAuth |
| `SLACK_REDIRECT_URI` | Slack OAuth redirect URL | `http://localhost:4000/slack/callback` |
| `MAX_EMAILS_PER_HOUR` | Hourly cap per sender | `50` |
| `MIN_DELAY_MS` | Minimum delay between sender jobs | `2000` |
| `WORKER_CONCURRENCY` | Number of concurrent worker jobs | `5` |

---

## ✅ Feature Checklist

- [x] **Monorepo setup**: Express backend, Next.js frontend, Docker Compose.
- [x] **Zero cron constraint**: 100% BullMQ delayed jobs + Redis timers.
- [x] **Idempotent dispatch**: Postgres-backed idempotency keys, DB status guards.
- [x] **Restart persistence**: Startup `reconcile()` reconciles PostgreSQL with BullMQ.
- [x] **Rate limiting**: Atomic Redis hourly counters (`ratelimit:{sender}:{hour}`).
- [x] **Slack alerting**: Real OAuth v2 flow + instant Slack alerts on hourly limit hit.
- [x] **Full-text search**: Elasticsearch indexer with fuzzy query + Postgres fallback.
- [x] **Live Queue UI**: Bull Board at `/admin/queues`.
- [x] **Next.js Dashboard**: Glassmorphism dark UI, Scheduled/Sent tabs, CSV lead parser, real-time polling.
- [x] **Ethereal Mailer**: Automatic test account generation with preview URLs in console.

---

## 💡 Assumptions & Design Decisions

1. **Prisma ORM**: Chosen for strict TypeScript type-safety, automatic migration generation, and clean schema definitions.
2. **Backend-Managed Auth**: Google OAuth exchange is performed entirely on the backend to issue a standard JWT. This ensures identical auth semantics for web, CLI, and future mobile clients.
3. **Resilient Elasticsearch Fallback**: If Elasticsearch is cold or restarting, search queries seamlessly fall back to Postgres case-insensitive ILIKE matching without breaking the dashboard UI.
4. **Ethereal Email Auto-Provisioning**: If `ETHEREAL_USER` and `ETHEREAL_PASS` are omitted in `.env`, the system automatically provisions an ephemeral Ethereal account on startup and logs the test inbox credentials to the console for zero-friction local testing.
