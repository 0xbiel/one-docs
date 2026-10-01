# Docker stack

This page explains the current Docker setup for the ONE backend. The exact
Dockerfile details are maintained in the sibling one-backend repository at
docs/docker.md; keep both pages aligned when a service or dependency changes.

## Prerequisites

Install Docker Desktop with the Linux container engine enabled. Keep the
repositories in sibling directories when using the optional web or demo
profiles:

~~~text
ONE/
  one-backend/
  one-frontend/       optional web profile
  one-demo-service/   optional demo profile
  one-docs/
~~~

The backend Compose file is the source of truth for service names, ports,
profiles and environment defaults. Do not copy real passwords, API keys,
model files or resident data into Git.

## Services and dependencies

The default stack builds the API image from the root one-backend Dockerfile.
That image uses Python 3.12 and installs the PostgreSQL runtime extra from
pyproject.toml. Its runtime dependencies are FastAPI, Uvicorn, Pydantic
Settings, multipart form handling, cryptography and psycopg.

The optional geometry worker uses geometry_service/Dockerfile. It has its own
requirements because it installs CPU PyTorch and torchvision, Ultralytics,
headless OpenCV, NumPy, Pillow, CLIP and the system libraries needed by the
vision stack. It also requires a YOLO-World checkpoint and the configured face
models mounted read-only. This image is large and is not required for the core
API.

| Service | Default or profile | Purpose | Host port |
| --- | --- | --- | --- |
| api | default | ONE FastAPI API | 8000 |
| postgres | default | PostgreSQL 16 database | internal |
| redis | default | cache and coordination slot | internal |
| minio | default | S3-compatible object storage slot | internal |
| livekit | default | local development WebRTC server | 7880, 7881, 7882/udp |
| vision-worker | vision | geometry and positioning | internal 8090 |
| frontend | web | sibling React/Vite app served by Nginx | 4175 |
| caddy | web | optional local HTTPS/reverse proxy | 8443 (HTTPS), 8080 (HTTP) with the checked-in `.env.example` |
| demo-service | demo | isolated demo service | 8100 |

The API, PostgreSQL, Redis, MinIO and LiveKit services start without a profile.
The vision, web and demo services are opt-in profiles. The API's dependency on
the vision worker is optional, so a missing worker must not prevent the core API
from starting.

The stack is not entirely loopback-only: the API and frontend default to
127.0.0.1, but LiveKit publishes media ports on all host interfaces and the
current Caddy service adds IPv6 wildcard (`[::]`) mappings. `ONE_CADDY_BIND`
controls its IPv4 mapping only. Restrict these ports with the host firewall on
untrusted networks; changing the Compose port mappings is required to remove
the IPv6 exposure.

## Start the core backend

Run these commands from the one-backend checkout. The local folder may be
named one instead of one-backend; use the folder that contains
docker-compose.yml.

~~~powershell
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
docker compose up --build -d
docker compose ps
Invoke-WebRequest -Uri "http://127.0.0.1:8000/api/v1/health" -UseBasicParsing
~~~

On macOS or Linux, the equivalent is:

~~~bash
cp .env.example .env
docker compose up --build -d
docker compose ps
curl http://127.0.0.1:8000/api/v1/health
~~~

The first build downloads the base images and Python packages. The API applies
the numbered PostgreSQL migrations during startup and records them in
schema_migrations. This includes outside-location migrations 016 and 017 and
care-planning migration 018.

The default host binding is loopback-only:
127.0.0.1:8000 for the API. The named volumes preserve PostgreSQL, object-store,
MinIO and Caddy state when containers are recreated.

## Start optional profiles

Start the web UI from the one-backend directory when one-frontend is present:

~~~powershell
docker compose --profile web up --build -d
~~~

This starts the API and its dependencies as well as the frontend on
127.0.0.1:4175. Caddy is included in the web profile. The checked-in
`.env.example` maps HTTPS to 8443 and HTTP to 8080; without a local `.env`, the
Compose fallback ports are 8080 and 8081. Change the corresponding
ONE_CADDY_HTTPS_PORT and ONE_CADDY_HTTP_PORT values in `.env` if those ports
are already in use.

Start the geometry worker only after configuring its local model paths:

~~~dotenv
ONE_GEOMETRY_MODEL_PATH=C:/absolute/path/to/yolov8s-worldv2.pt
ONE_FACE_MODELS_PATH=C:/absolute/path/to/face-models
~~~

Then run:

~~~powershell
docker compose --profile vision up --build -d
~~~

The profiles can be combined:

~~~powershell
docker compose --profile vision --profile web up --build -d
~~~

The demo profile requires one-demo-service to exist beside one-backend:

~~~powershell
docker compose --profile demo up --build -d
~~~

## Android and LAN testing

An Android emulator reaches services on the host through 10.0.2.2:

~~~text
http://10.0.2.2:8000/api/v1
~~~

This alias works only when the API port is bound on the host loopback. If
`ONE_API_BIND` binds Docker only to a LAN address, add
`one.apiBaseUrl=http://<HOST_LAN_IP>:8000/api/v1` to the ignored
`one-android/local.properties`, then rebuild the debug app in Android Studio.
An explicit `-PoneApiBaseUrl=...` build argument takes precedence. Verify the
emulator can reach that LAN address before testing sign-in.

A physical phone needs the computer's LAN address. Set the API binding in
one-backend/.env and restart the stack:

~~~dotenv
ONE_API_BIND=192.168.1.132
ONE_API_PORT=8000
ONE_LIVEKIT_URL=ws://192.168.1.132:7880
ONE_LIVEKIT_NODE_IP=192.168.1.132
~~~

Replace 192.168.1.132 with the computer's current IPv4 address. Use that same
address in the Android API base URL. Do not use 127.0.0.1 or localhost on the
phone: those addresses refer to the phone itself. Allow only the required API
and LiveKit ports through the firewall on the trusted private network.
Binding to the specific LAN IP avoids publishing the API on every host interface.

A health check from the computer proves local container health only. For a
physical-phone test, the phone must also be able to reach the host address
over Wi-Fi.

## Logs, restart and shutdown

~~~powershell
docker compose ps
docker compose logs --tail=200 api
docker compose logs --tail=200 postgres
docker compose restart api
docker compose down
~~~

docker compose down removes containers but keeps named volumes. Do not add -v
unless deleting the local database, object store and MinIO data is intentional
and backed up.

If Docker Desktop shows an old stopped project named one-backend, run the
commands from the current one-backend checkout and inspect docker compose ps.
The Docker Desktop row can represent an earlier Compose project and should not
be used as the source of truth for the current configuration.

## Troubleshooting

- If the app reports could not reach the ONE API, test the health endpoint on
  the computer, then test the computer's LAN IP from the phone. Check the
  Windows firewall and ONE_API_BIND. Android debug already permits HTTP for a
  local backend; release requires HTTPS. The Android client wraps request
  exceptions in a generic message, so check the compiled API URL and Logcat
  rather than assuming the HTTP policy is the cause.
- If port 8000 is busy, change ONE_API_PORT or stop the process using it.
- If the vision build fails, leave the vision profile disabled and verify the
  checkpoint and face-model paths before retrying.
- If PostgreSQL fails, inspect docker compose logs postgres. Do not delete the
  volume as a first diagnostic step.
- If LiveKit works on the computer but not on the phone, set
  ONE_LIVEKIT_URL and ONE_LIVEKIT_NODE_IP to a host-reachable LAN address and
  check UDP 7882.

## Outside tracking update

Pull the matching `one-backend/android-test` and
`one-android/feature/outside-companion-tracking` changes together. From
`one-backend`, run `docker compose up --build -d api` and check the API logs.
Migration 017 extends the existing PostgreSQL volume; back up the volume
before updating and do not use `docker compose down -v`. Seven-day location
retention runs hourly while the API is active and on history reads. A shared
history clear is available only to the household admin and is applied to
offline phones when they reconnect.

Optional street names require `ONE_GEOCODER_BASE_URL` in `one-backend/.env`,
pointing to a Nominatim-compatible service you operate or are licensed to use.
Compose does not launch a geocoder. Leave it unset to show zones or coordinates;
Android no longer contacts the public Nominatim service directly. No Dockerfile
or Python dependency change is needed for this update.

## Care planning update

Migration 018 adds shared caregiver notes and appointments. Back up PostgreSQL
before rebuilding the API with `docker compose up --build -d api`; startup
applies the migration without removing existing data. The Python `tzdata`
dependency is installed through `pyproject.toml`, so the Dockerfile does not
need a separate change. Android appointment alerts are local to a synced phone
and require notification permission; they are not server push notifications.
