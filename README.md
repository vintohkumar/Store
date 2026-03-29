# Store

Traditional clothing store landing page with:

- **Client:** Next.js + CSS
- **Server:** Flask Python API

## Run Locally

### 1) Start Flask API

```bash
cd Server
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python app.py
```

API runs on `http://127.0.0.1:5000`.
On startup, Flask connects to PostgreSQL and initializes tables from `Server/schema.sql`.

### 1.0) OTP setup (real operations)

`/login` uses these Flask endpoints:

- `POST /api/auth/send-otp`
- `POST /api/auth/verify-otp`

Configure providers in `Server/.env`:

- **SMS (Twilio):** `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`
- **Email (SMTP):** `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_FROM_EMAIL`, `SMTP_USE_TLS`
- **Security controls:** `OTP_SECRET`, `OTP_EXPOSE_DEV_CODE`, `OTP_RESEND_COOLDOWN_SECONDS`, `OTP_MAX_SEND_PER_HOUR`

Recommended:

- Set `OTP_EXPOSE_DEV_CODE=false` outside local development.
- Use a strong random value for `OTP_SECRET`.
- Check provider readiness: `GET /api/auth/provider-health`

### 1.0.1) Local SMTP setup (Mailpit for testing)

Use Mailpit to capture OTP emails locally without sending real mail.

#### Option A: Docker

```bash
docker run -d --name mailpit -p 1025:1025 -p 8025:8025 axllent/mailpit
```

Mail UI: `http://127.0.0.1:8025`

#### SMTP values in `Server/.env`

```env
SMTP_HOST=127.0.0.1
SMTP_PORT=1025
SMTP_USERNAME=
SMTP_PASSWORD=
SMTP_FROM_EMAIL=no-reply@vastra.local
SMTP_USE_TLS=false
```

After this, choose **Email OTP** on `/login`, send OTP, then view the email in Mailpit UI.

PostgreSQL environment variables (`Server/.env`):

- `DB_HOST` (default: `127.0.0.1`)
- `DB_PORT` (default: `5432`)
- `DB_NAME` (default: `clothing_store`)
- `DB_USER` (default: `postgres`)
- `DB_PASSWORD` (default: `postgres`)
- `DB_SSLMODE` (default: `prefer`)
- `DB_OPTIONS` (default: `-c search_path=public`)

### 1.1) Apply DB security hardening (RBAC + RLS)

Run once after base schema setup:

```bash
cd Server
py -c "from db import initialize_database; initialize_database('security_hardening.sql'); print('security_hardening_applied')"
```

RLS requires setting request user context before user-scoped queries:

```python
from db import get_connection, set_app_user_context

conn = get_connection()
set_app_user_context(conn, user_id)
# run queries...
```

### 1.1.1) Apply least-privilege role split

```bash
cd Server
py -c "from db import initialize_database; initialize_database('least_privilege_roles.sql'); print('least_privilege_applied')"
```

Notes:
- `least_privilege_roles.sql` enforces no schema-create for runtime roles and keeps `login_sessions` denied for app/read users.
- Creating `db_migrator` and `db_app` requires a role with `CREATEROLE`; if not available, script applies fallback hardening to existing roles (`app_user`, `readonly_user`, `db_admin`).

### 1.2) Enable PostgreSQL TLS and enforce SSL

Current local PostgreSQL was detected on port `5433`.

1. Open `postgresql.conf` and set:
   - `ssl = on`
   - keep `port = 5433`
2. Place cert/key files in PostgreSQL data directory:
   - `server.crt`
   - `server.key`
3. In `pg_hba.conf`, require SSL for clients (example):
   - `hostssl all all 127.0.0.1/32 scram-sha-256`
4. Restart PostgreSQL service.
5. Update app env:
   - `DB_PORT=5433`
   - `DB_SSLMODE=require` (minimum)
   - For strict verification, use `verify-full` with trusted CA.

Verify from SQL:

```sql
SHOW ssl;
SELECT ssl FROM pg_stat_ssl WHERE pid = pg_backend_pid();
```

### 2) Start Next.js Client

```bash
cd Client
npm install
npm run dev
```

Client runs on `http://localhost:3000` in development mode.

Optional client environment variable (`Client/.env.local`):

- `NEXT_PUBLIC_API_BASE_URL` (default: `http://127.0.0.1:5000`)

## Logging

- Server actions/requests are written to: `logs/server_logs.txt`
- Client actions (page views, clicks, form submits, OTP flow actions) are written to: `logs/client_logs.txt`

Client logging pipeline:

- Browser -> `POST /api/logs` (Next.js API route) -> append to `logs/client_logs.txt`
