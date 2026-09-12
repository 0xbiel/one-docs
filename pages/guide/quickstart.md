# Quickstart

This path runs the current local MVP: a SQLite FastAPI backend and a React/Vite frontend. It does not require PostgreSQL, Redis, MinIO, LiveKit, or a downloaded vision model. For a same-origin Docker run, use the Docker path below instead of manually wiring browser CORS.

## 1. Start the backend

```bash
cd one
python -m venv .venv
source .venv/bin/activate
pip install -e '.[dev]'
cp .env.example .env # if the example file exists in your checkout
uvicorn app.main:app --reload --port 8000
```

The API is available at `http://localhost:8000`. Verify it:

```bash
curl http://localhost:8000/api/v1/health
```

Expected shape:

```json
{"status":"ok","database":"sqlite","local_inference_model":"qwen3.6-35b-a3b"}
```

OpenAPI is generated at [`/api/v1/openapi.json`](http://localhost:8000/api/v1/openapi.json).

## 2. Start the web app

In a second terminal:

```bash
cd one-frontend
npm ci
npm run dev
```

Open the Vite URL (normally `http://localhost:5173`). Without a stored session the dashboard uses its demo data, which makes the product walkthrough deterministic. For live API calls, set `VITE_DEMO_MODE=false` and `VITE_API_BASE_URL=http://localhost:8000/api/v1` in `one-frontend/.env`.

The frontend’s default `.env.example` uses `VITE_API_BASE_URL=/api/v1` for Docker. Its Nginx config proxies that path to FastAPI, so the browser stays on one origin.

## Docker and same-origin access

From `one/`:

```bash
docker compose up --build api frontend
```

Open `http://127.0.0.1:4173`. The frontend container serves the SPA and proxies `/api/*` to the API container. Set `ONE_FRONTEND_DEMO_MODE=true` only for deterministic synthetic data; the compose default is live mode.

For phone access on a private tailnet, install Tailscale on the host and expose the web container:

```bash
tailscale serve --bg http://127.0.0.1:4173
tailscale serve status
```

Use the HTTPS URL shown by `tailscale serve status` for browser testing and as the iOS `ONE_API_BASE_URL` base, keeping the `/api/v1` suffix (for example, `https://one-host.<tailnet>.ts.net/api/v1`). Tailscale Serve is a network setup step, not an identity or production deployment guarantee.

## 3. Pair a device

The backend pairing flow is intentionally short-lived:

```bash
curl -s http://localhost:8000/api/v1/pairing/start \
  -H 'Content-Type: application/json' \
  -d '{"display_name":"Demo caregiver","home_name":"ONE Home","role":"caregiver"}'
```

Copy the returned `pairing_code` immediately. Complete it once:

```bash
curl -s http://localhost:8000/api/v1/pairing/complete \
  -H 'Content-Type: application/json' \
  -d '{"code":"REPLACE_WITH_CODE"}'
```

Send the returned bearer token on protected requests. Pairing codes expire after 10 minutes and are stored hashed, not as plaintext.

## What “working” means here

You have a valid local run when health returns `ok`, the web dashboard loads, and the demo can navigate through dashboard, family, map, events, assistant, privacy, join, and publisher routes. A loaded dashboard is not proof that a real camera, LiveKit room/subscriber, external model, or production database is connected.
