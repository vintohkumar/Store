# Next Actions - Sprint Execution Board

Last updated: 2026-03-30

## Sprint 1 (Highest Priority) - Security + Auth Foundation

### 1) Replace in-memory OTP store with persistent storage
- **Status:** Pending
- **Priority:** P0
- **Effort:** 1.5-2 days
- **Owner:** Backend
- **Dependencies:** PostgreSQL/Redis availability
- **Scope:**
  - Store OTP hash, expiry, attempts, cooldown metadata in DB/Redis
  - Add cleanup job for expired OTP entries
  - Ensure horizontal scalability (shared state, no in-memory reliance)
- **Acceptance criteria:**
  - OTP send/verify works after Flask restart
  - OTP state is shared across multiple server instances
  - Expired OTPs auto-cleaned

### 2) Add JWT/session issuance after OTP verification
- **Status:** Pending
- **Priority:** P0
- **Effort:** 1.5-2 days
- **Owner:** Backend + Frontend
- **Dependencies:** Task 1
- **Scope:**
  - Issue access token (and optional refresh token) on OTP success
  - Store token in secure cookie or managed client storage
  - Add logout token invalidation strategy
- **Acceptance criteria:**
  - Protected endpoints reject missing/invalid tokens
  - Login persists across refresh
  - Logout invalidates active session

### 3) Protect user routes and bind real auth state
- **Status:** Pending
- **Priority:** P0
- **Effort:** 1 day
- **Owner:** Frontend
- **Dependencies:** Task 2
- **Scope:**
  - Gate `/profile`, `/orders`, `/favorites`, `/cart` based on real auth
  - Replace localStorage-only auth marker with token/session check
- **Acceptance criteria:**
  - Unauthorized users are redirected to `/login`
  - Profile dropdown reflects true authenticated state from API

---

## Sprint 2 - Commerce Data Integration

### 4) Product search from backend (not local in-memory filter)
- **Status:** Pending
- **Priority:** P1
- **Effort:** 1-1.5 days
- **Owner:** Full-stack
- **Dependencies:** Product table readiness
- **Scope:**
  - Add API query endpoint for product search + pagination
  - Frontend search calls API on submit and renders server results
- **Acceptance criteria:**
  - Search results come from backend
  - Handles no results / loading / error states gracefully

### 5) Orders page real data integration
- **Status:** Pending
- **Priority:** P1
- **Effort:** 1 day
- **Owner:** Full-stack
- **Dependencies:** Auth token + orders API
- **Scope:**
  - Replace placeholder `/orders` page with user-specific order timeline
  - Include status, amount, order date, and item count
- **Acceptance criteria:**
  - Logged-in user sees only own orders
  - Empty-state and loading state implemented

### 6) Wishlist/favorites persistence
- **Status:** Pending
- **Priority:** P1
- **Effort:** 1 day
- **Owner:** Full-stack
- **Dependencies:** Auth token + wishlist API
- **Scope:**
  - Add save/remove favorite API
  - Sync header icon route and favorites page with backend state
- **Acceptance criteria:**
  - Favorites persist after refresh/relogin
  - Add/remove reflects immediately in UI

---

## Sprint 3 - Reliability + Observability

### 7) Log rotation and retention
- **Status:** Pending
- **Priority:** P1
- **Effort:** 0.5-1 day
- **Owner:** Backend
- **Dependencies:** None
- **Scope:**
  - Rotate `logs/server_logs.txt` and `logs/client_logs.txt`
  - Retain by max size and max file count
- **Acceptance criteria:**
  - Logs do not grow unbounded
  - Rotation policy documented

### 8) Structured error tracking baseline
- **Status:** Pending
- **Priority:** P2
- **Effort:** 1 day
- **Owner:** Full-stack
- **Dependencies:** None
- **Scope:**
  - Add request correlation id
  - Include correlation id in server/client log entries
  - Add consistent error response envelope
- **Acceptance criteria:**
  - A frontend error can be traced to server logs by correlation id

---

## Sprint 4 - DevOps + Launch Readiness

### 9) CI pipeline (build + lint + smoke tests)
- **Status:** Pending
- **Priority:** P1
- **Effort:** 1 day
- **Owner:** DevOps/Full-stack
- **Dependencies:** test commands availability
- **Scope:**
  - Add CI workflow for client build, backend lint/check
  - Add basic smoke tests for `/health` and auth endpoints
- **Acceptance criteria:**
  - PR/build gate fails on compile/lint errors
  - Health checks pass automatically in CI

### 10) Deployment blueprint and environment hardening
- **Status:** Pending
- **Priority:** P1
- **Effort:** 1-2 days
- **Owner:** DevOps
- **Dependencies:** env and secrets finalized
- **Scope:**
  - Frontend deploy target + backend deploy target finalization
  - Environment variable matrix (dev/stage/prod)
  - Secret management and production flags (`OTP_EXPOSE_DEV_CODE=false`)
- **Acceptance criteria:**
  - End-to-end app runs in staging with real OTP providers
  - Production config checklist signed off

---

## Current Recommendation (Execution Order)

1. Sprint 1 tasks 1-3
2. Sprint 2 tasks 4-6
3. Sprint 3 tasks 7-8
4. Sprint 4 tasks 9-10

---

## Definition of "Ready for Production Pilot"

- OTP no longer depends on in-memory store
- Auth tokens and protected routes are fully enforced
- Search/orders/wishlist backed by real APIs
- Logging is rotated and traceable
- CI and staging deployment are active
