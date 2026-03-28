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
python app.py
```

API runs on `http://127.0.0.1:5000`.

### 2) Start Next.js Client

```bash
cd Client
npm install
npm run dev
```

Client runs on `http://localhost:3000` in development mode.

Optional client environment variable (`Client/.env.local`):

- `NEXT_PUBLIC_API_BASE_URL` (default: `http://127.0.0.1:5000`)
