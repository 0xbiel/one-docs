# Docker stack

`one/docker-compose.yml` wires the API and frontend to PostgreSQL, Redis, MinIO,
LiveKit, and Caddy. The frontend is served by Nginx and routes `/api/*` to
FastAPI on the same origin. PostgreSQL is the Compose default; SQLite is
retained as an explicit zero-setup test backend. The room-layout worker is a
separate host-side dependency and is not started by Compose. This is deployment
wiring for the MVP, not a complete production hardening profile.

```bash
cd one
test -f .env || cp .env.example .env # create/fill locally; never commit it
docker compose up --build -d api frontend
```

The API is bound to `127.0.0.1:8000`; the current Compose frontend default is
`127.0.0.1:4175`; LiveKit publishes `7880`, `7881`, and `7882/udp` for LAN
WebRTC testing; Caddy is loopback-only on `8443` (HTTPS) and `8080` (HTTP) by
default. Override `ONE_CADDY_HTTPS_PORT` or `ONE_CADDY_HTTP_PORT` only for a
controlled ingress. The stack also creates named volumes for object data,
Postgres, MinIO, and Caddy state. `ONE_FRONTEND_BIND` controls the host
interface; it defaults to `127.0.0.1` and should only be set to `0.0.0.0` for a
trusted same-LAN test. If a local `.env` pins another frontend port, use that
actual port in the browser and Tailscale commands.

## Service roles

| Service | Role in the current compose file | Status boundary |
| --- | --- | --- |
| `api` | FastAPI image, PostgreSQL adapter, local object path, LM Studio host bridge | Runnable; waits for PostgreSQL health and applies numbered migrations |
| `frontend` | Node build + Nginx SPA, `/api/` reverse proxy | Runnable; build args default to same-origin `/api/v1` and live mode |
| `postgres` | PostgreSQL 16 | Authoritative Compose database; persistent `one_pg` volume and readiness check |
| `redis` | Event/cache dependency slot | No durable Redis event adapter is currently wired |
| `minio` | S3-compatible object-store slot | API currently uses the local object-store adapter |
| `livekit` | Self-hosted development LiveKit server | Uses local `devkey`/`secret`; no subscription; replace credentials and URL before shared use |
| `caddy` | TLS/reverse proxy | Provision a local CA for LAN clients; replace example secrets |

Replace every `change-me` value and the `ONE_POSTGRES_*`/`ONE_MINIO_*` Compose credentials before using this on a network. Keep LM Studio on a trusted local boundary and do not expose its port publicly.

## Local M3 Pro room-layout worker

Automatic camera mapping requires a host-side room-layout process with
PyTorch's MPS device on the M3 Pro when available. The worker is not the
summary model: LM Studio and Qwen produce bounded language summaries, while
the room-layout worker consumes temporary RGB sweep samples and returns
relative 2D polygons, wall segments, camera pose, confidence, and model
metadata.

Keep the worker bound to the Mac's private interface. The API container reaches
host services through Docker's host bridge; the iPhone never connects directly
to the worker. The backend should report the worker as unavailable when it
cannot reach it, and the UI must leave the previous map active rather than
creating fallback rectangles.

Compose configures the API to call
`http://host.docker.internal:8090` by default through
`ONE_GEOMETRY_SERVICE_URL`, with a 45-second timeout and GPU required. Start
the host-side service separately from `one/geometry_service/`; model mode needs
the real YOLOv8-World v2 checkpoint, the checked-in model configuration,
Ultralytics/OpenCV dependencies, and a working MPS runtime. If the service is
not ready, map jobs report `unavailable` and keep the previous map active; the
API never turns that state into synthetic geometry. See
[Camera mapping](/architecture/camera-mapping) for the worker's contract.

## Tailscale Serve

After the frontend is up, expose only the web origin to a private tailnet. The
command must target the port you actually started; the current Compose default
is `4175`:

```bash
tailscale serve --bg http://127.0.0.1:4175
tailscale serve --bg --https=8444 http://127.0.0.1:7880
tailscale serve status
```

Open the reported website HTTPS URL on the iPhone. The browser uses the
same-origin `/api/v1` proxy; do not configure the phone with
`127.0.0.1` or `localhost`. Configure native iOS with that URL plus
`/api/v1` through the `ONE_API_BASE_URL` build setting. For a phone camera or
LiveKit viewer, set `ONE_LIVEKIT_URL` in the backend `.env` to the reported
Tailscale LiveKit URL (`wss://<tailnet-host>:8444`) and restart `api`;
Keep Caddy and Tailscale responsibilities separate: Caddy provides the optional
local reverse-proxy/TLS policy, while Tailscale Serve provides tailnet
reachability. Both Serve entries are private to the tailnet; do not use Funnel
for household video.
