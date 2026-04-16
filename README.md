# HyperCollab — Distributed Real-Time Collaboration Platform

A production-grade, distributed collaboration platform demonstrating system design, real-time infrastructure, event-driven architecture, and C++ systems programming.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                              │
│                    http://localhost                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
              ┌────────▼────────┐
              │   Nginx :80     │  ← Static React app
              │  Reverse Proxy  │  ← /api/* → backend
              │                 │  ← /ws    → backend WS
              └────────┬────────┘
                       │
              ┌────────▼────────┐
              │  Node.js :5001  │  ← REST API + WebSocket
              │    (Express)    │
              └──┬──────┬───┬───┘
                 │      │   │
        ┌────────▼─┐ ┌──▼──┐ ┌▼────────┐
        │ MongoDB  │ │Redis│ │  Kafka  │
        │ :27017   │ │:6379│ │  :9092  │
        └──────────┘ └─────┘ └──┬──────┘
                                 │
                         ┌───────▼───────┐
                         │  C++ Analytics│
                         │    Engine     │
                         └───────────────┘
```

### Services

| Service            | Technology          | Port | Purpose                             |
|--------------------|---------------------|------|-------------------------------------|
| `frontend`         | React + Vite + Nginx| 80   | Static UI + reverse proxy           |
| `backend`          | Node.js + Express   | 5001 | REST API + WebSocket server         |
| `analytics_engine` | C++ (librdkafka)    | —    | Kafka consumer → Redis metrics      |
| `mongo`            | MongoDB 6           | 27017| Persistent document store           |
| `redis`            | Redis 7             | 6379 | Analytics cache + session data      |
| `kafka`            | Confluent CP 7.4    | 9092 | Event bus (task lifecycle events)   |
| `zookeeper`        | Confluent CP 7.4    | 2181 | Kafka coordinator                   |

---

## Quick Start (Docker)

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) ≥ 24
- 4 GB RAM available for containers (Kafka + Zookeeper are memory-hungry)

### 1. Clone and configure

```bash
git clone <repo-url> hypercollab
cd hypercollab

# Create your local env file (optional — defaults work for local Docker)
cp .env.example .env
```

> **Production tip:** Before deploying, update the JWT secrets in `.env`.

### 2. Build and run (single command)

```bash
docker compose up --build
```

The first build compiles the C++ analytics engine and bundles the React frontend — expect 2–5 minutes.

### 3. Open the app

| URL                           | What you see              |
|-------------------------------|---------------------------|
| http://localhost              | HyperCollab Web App       |
| http://localhost/api/health   | Backend health check JSON |

### 4. Tear down

```bash
# Stop containers (keeps volumes / data)
docker compose down

# Stop and delete all data volumes
docker compose down -v
```

---

## Local Development (without Docker)

Run each service individually for fast hot-reload.

### Backend

```bash
cd backend
cp ../.env.example .env   # then edit values
npm install
npm run dev               # nodemon — auto-restarts on change
```

> Requires local MongoDB, Redis, and Kafka, **or** set `MONGO_URI` to your Atlas cluster.

### Frontend

```bash
cd frontend
npm install
npm run dev               # Vite dev server — http://localhost:5173
```

### C++ Analytics Engine (macOS)

```bash
brew install librdkafka hiredis cmake

cd cpp_services/analytics_engine
cmake -S . -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build

KAFKA_BROKERS=localhost:9092 REDIS_HOST=127.0.0.1 ./build/analytics_engine
```

---

## Environment Variables

See [`.env.example`](.env.example) for the full reference. Key variables:

| Variable               | Default (Docker)               | Description                              |
|------------------------|--------------------------------|------------------------------------------|
| `MONGO_URI`            | `mongodb://mongo:27017/...`    | MongoDB connection string                |
| `ACCESS_TOKEN_SECRET`  | *(must set in production)*     | JWT signing secret                       |
| `REFRESH_TOKEN_SECRET` | *(must set in production)*     | JWT refresh signing secret               |
| `REDIS_URL`            | `redis://redis:6379`           | Redis connection (overrides HOST+PORT)   |
| `KAFKA_BROKER`         | `kafka:29092`                  | Kafka bootstrap server for Node.js       |
| `CORS_ORIGIN`          | `http://localhost`             | Comma-separated allowed frontend origins |

---

## Features

- 🔐 **JWT Auth** — Access + refresh token rotation, RBAC (Admin / Member / Viewer)
- 🗂️ **Workspaces & Boards** — Multi-tenant task management (Trello-style)
- 💬 **Real-Time Chat** — WebSocket rooms per workspace, typing indicators, presence
- ⚡ **Live Task Updates** — Task changes broadcast instantly to all workspace members
- 📊 **Analytics Dashboard** — C++ engine consumes Kafka events → Redis → React charts
- 🚀 **Event-Driven** — Kafka decouples task lifecycle from analytics processing
- 🐳 **One-command Deploy** — Full stack via `docker compose up --build`

---

## Project Structure

```
distributed_hypercollab_platform/
├── backend/                    # Node.js API server
│   ├── src/
│   │   ├── config/             # Kafka, Redis clients
│   │   ├── controllers/        # Route handlers
│   │   ├── middleware/         # Auth, RBAC
│   │   ├── models/             # Mongoose schemas
│   │   ├── routes/             # Express routers
│   │   └── websocket/          # WS server (chat + live updates)
│   ├── Dockerfile
│   └── server.js
├── frontend/                   # React + Vite SPA
│   ├── src/
│   │   ├── features/           # Redux slices (auth, board, chat)
│   │   ├── hooks/              # useWebSocket
│   │   └── lib/                # Axios instance
│   └── Dockerfile
├── cpp_services/
│   └── analytics_engine/       # C++ Kafka consumer
│       ├── src/main.cpp
│       ├── include/nlohmann/   # JSON header
│       ├── CMakeLists.txt
│       └── Dockerfile
├── nginx/
│   └── nginx.conf              # Reverse proxy config
├── docs/                       # Architecture + feature docs
├── docker-compose.yml          # Full stack orchestration
└── .env.example                # Environment variable reference
```
