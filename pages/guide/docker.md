# Docker stack

`one/docker-compose.yml` wires the API and frontend to PostgreSQL, Redis, MinIO, LiveKit, and Caddy. The frontend is served by Nginx and routes `/api/*` to FastAPI on the same origin. It is deployment wiring for the MVP, not a complete production hardening profile.

```bash
cd one
cp .env.example .env # create and fill this locally; never commit it
docker compose up --build api frontend
```

The API is bound to `127.0.0.1:8000`; the frontend is bound to `127.0.0.1:4173`; LiveKit publishes `7880`, `7881`, and `7882/udp` for LAN WebRTC testing; Caddy is loopback-only on `8443` (HTTPS) and `8080` (HTTP) by default. Override `ONE_CADDY_HTTPS_PORT` or `ONE_CADDY_HTTP_PORT` only for a controlled ingress. The stack also creates named volumes for object data, Postgres, MinIO, and Caddy state.

## Service roles

| Service | Role in the current compose file | Status boundary |
| --- | --- | --- |
| `api` | FastAPI image, local object path, LM Studio host bridge | Runnable; defaults to SQLite unless overridden |
| `frontend` | Node build + Nginx SPA, `/api/` reverse proxy | Runnable; build args default to same-origin `/api/v1` and live mode |
| `postgres` | PostgreSQL 16 | Image is wired; production adapter/migrations are not complete |
| `redis` | Event/cache dependency slot | No durable Redis event adapter is currently wired |
| `minio` | S3-compatible object-store slot | API currently uses the local object-store adapter |
| `livekit` | Self-hosted development LiveKit server | Uses local `devkey`/`secret`; no subscription; replace credentials and URL before shared use |
| `caddy` | TLS/reverse proxy | Provision a local CA for LAN clients; replace example secrets |

Replace every `change-me` value and the `ONE_POSTGRES_*`/`ONE_MINIO_*` Compose credentials before using this on a network. Keep LM Studio on a trusted local boundary and do not expose its port publicly.

## Tailscale Serve

After the frontend is up, expose only the web origin to a private tailnet:

```bash
tailscale serve --bg http://127.0.0.1:4173
tailscale serve status
```

Open the reported HTTPS URL on a phone. Configure iOS with that URL plus `/api/v1` through the `ONE_API_BASE_URL` build setting. Keep Caddy and Tailscale responsibilities separate: Caddy provides the local reverse-proxy/TLS policy, while Tailscale Serve provides tailnet reachability.
