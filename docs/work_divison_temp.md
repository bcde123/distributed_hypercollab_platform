
# 🗓️ HyperCollab – Final 6-Week Execution Plan (2 People)


## 🧱 WEEK 1 — Core Foundation (MERN Fast Track)

🎯 *Goal: secure, working base app*

### Person A

* Node.js + Express project setup
* JWT auth (login / register)
* Refresh tokens
* RBAC middleware (Admin / Member / Viewer)
* MongoDB User & workspace schema

### Person B

* React app setup (Tailwind)
* Login / Signup UI
* Protected routes
* Basic dashboard layout
* API integration (auth flow)

### Joint (Mandatory)

* Freeze DB schema
* Freeze role permissions
* Architecture diagram (v1)

✅ **End of Week 1**

* Login works
* Roles enforced
* Dashboard visible

---

## 🧱 WEEK 2 — Boards, Tasks & Core Product (MERN Done)

🎯 *Goal: finish all non–real-time features*

### Person A

* Boards & Tasks REST APIs
* Task status flow (Todo → Done)
* MongoDB indexes
* Emit **mock events** (console logs)

### Person B

* Kanban board UI
* Task CRUD UI
* Assign users
* Global state management

### Joint

* API contract review
* Error handling
* Data consistency checks

✅ **End of Week 2**

* Full Trello-like experience
* Multi-user workspaces
* Stable MERN app

> ⚠️ MERN **must be DONE here**.
> From Week 3 onward, C++ dominates.

---

## 🧱 WEEK 3 — C++ + WebSockets (Learning Week)

🎯 *Goal: understand C++ networking without panic*

### Person A (C++ focus)

* Learn C++ basics (syntax, memory, threads)
* Build simple C++ WebSocket server
* Accept connections
* Broadcast messages (no rooms yet)

### Person B (Bridge role)

* Learn WebSocket protocol
* Build WS client in React
* Connect frontend → C++ server
* Define JSON message format

### Joint

* Test multiple browser tabs
* Document message protocol

✅ **End of Week 3**

* Chat works
* C++ server running
* Everyone understands basics of WS

---

## 🧱 WEEK 4 — Real-Time Collaboration + Kafka Intro

🎯 *Goal: live collaboration works*

### Person A

* Improve C++ server:

  * Thread pool
  * workspace-based rooms
  * Connection cleanup
* Handle reconnects

### Person B

* Sync REST + WebSocket
* Live task updates
* Typing indicators
* UI polish for real-time events

### Kafka (Both – light but real)

* Kafka setup (local)
* Node → publish task events
* Simple Kafka consumer (log events)

✅ **End of Week 4**

* Multiple users see updates instantly
* Kafka running
* Real-time feels “real”

---

## 🧱 WEEK 5 — Analytics Engine (🔥 Resume Week)

🎯 *Goal: analytics pipeline actually works*

### Person A

* Kafka consumer in C++
* Process task events
* Compute metrics:

  * Avg completion time
  * Tasks per user
* Store results in Redis

### Person B

* Analytics API
* Dashboard UI (charts)
* Fetch metrics from Redis
* Optional live refresh

### Joint

* Validate analytics correctness
* Test with fake load

✅ **End of Week 5**

* Analytics dashboard
* Event-driven data flow
* Strong “engineering depth” story

---

## 🧱 WEEK 6 — DevOps, Polish & Interview Prep

🎯 *Goal: production-ready demo*

### Person A

* Dockerize C++ services
* Performance notes (latency, concurrency)
* Logging + health checks

### Person B

* Dockerize MERN stack
* Nginx reverse proxy
* Error states + UX polish

### Joint

* Docker Compose (one command run)
* Final architecture diagram
* README
* Resume bullets
* Mock interview Q&A

✅ **Final Demo**

* One command deploy
* Real-time collaboration
* Analytics dashboard

---

# 📊 Feature Completion Map

| Feature          | Week |
| ---------------- | ---- |
| Auth + RBAC      | 1    |
| workspaces       | 1    |
| Boards & Tasks   | 2    |
| Real-time Chat   | 3–4  |
| Live Updates     | 4    |
| Kafka Events     | 4    |
| Analytics Engine | 5    |
| Dashboard        | 5    |
| Docker + Deploy  | 6    |


