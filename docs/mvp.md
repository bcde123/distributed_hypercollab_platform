# Distributed HyperCollab Platform – MVP Definition

## Objective
The goal of this MVP is to build a **distributed, real-time collaboration platform**
that demonstrates:
- system design thinking
- backend & distributed systems fundamentals
- low-latency real-time communication
- clean API design
- production-oriented engineering

This MVP is intentionally limited in scope to ensure **correctness, depth, and polish**
rather than feature bloat.

---

## Core MVP Features (Frozen Scope)

### 1. User Authentication (JWT-based)
**Purpose:** Secure access control and identity management

**Functional Requirements:**
- User signup with email & password
- User login with JWT access token
- Protected routes for authenticated users
- Logout by token invalidation (client-side)

**Out of Scope (for MVP):**
- OAuth (Google/GitHub)
- Role-based permissions
- Email verification

---

### 2. Workspace Management
**Purpose:** Logical grouping of users and collaboration data

**Functional Requirements:**
- Create a workspace
- Join a workspace using workspace ID
- List all workspaces a user belongs to

**Constraints:**
- A user can belong to multiple workspaces
- Each workspace has an owner

---

### 3. Board & Task CRUD
**Purpose:** Core productivity functionality

**Entities:**
- Board
- Task

**Functional Requirements:**
- Create / update / delete boards within a workspace
- Create / update / delete tasks within a board
- Update task status (e.g. TODO → IN_PROGRESS → DONE)

**Constraints:**
- No complex permissions (all workspace members can modify)
- No drag-and-drop UI required

---

### 4. Real-Time Chat (Basic)
**Purpose:** Demonstrate real-time systems & low-latency communication

**Implementation:**
- WebSocket-based real-time chat
- Separate C++ real-time server
- Messages scoped to a workspace

**Functional Requirements:**
- Users can send messages in a workspace
- Messages are broadcast to all connected users
- Messages are ephemeral (not persisted initially)

**Out of Scope:**
- Message history persistence
- Read receipts
- Typing indicators

---

### 5. Analytics (Single Metric)
**Purpose:** Demonstrate event-driven & distributed analytics

**Metric Implemented:**
- Number of tasks completed per user

**Architecture:**
- Backend emits events on task completion
- Events are consumed by a C++ analytics service
- Aggregated counts stored in Redis

**Functional Requirements:**
- Increment counter when a task is marked DONE
- Fetch analytics summary for a workspace

---

## Non-Goals (Explicitly Excluded)
The following are intentionally excluded to keep the MVP focused:
- Notifications
- File uploads
- Search
- Comments on tasks
- Mobile support
- Kubernetes deployment

---

## Success Criteria
The MVP is considered complete if:
- All services run locally using Docker Compose
- Core APIs function correctly
- Real-time chat works reliably
- Analytics metric updates correctly
- Code is clean, documented, and testable

---

## Engineering Focus
This project prioritizes:
- clear service boundaries
- correctness over feature count
- scalable design patterns
- demonstrable understanding of distributed systems

