# Troubleshooting

## `401 Bearer session required` or `Session expired`

Pairing completion returns the only bearer token for that session. Send it as `Authorization: Bearer <token>` and do not reuse an expired or logged-out token. The web client stores its demo/live session identifiers in `sessionStorage`.

## `403 Active video_capture consent is required`

Consent is an execution gate. Grant the `video_capture` purpose for the home and confirm the home is not paused before submitting frames or creating a LiveKit token.

## CORS errors from Vite

Set `ONE_CORS_ORIGINS` to the exact Vite origin, for example `http://localhost:5173`. Restart Uvicorn after changing `.env`.

When using Docker, do not set a hard-coded API host in the browser: use `VITE_API_BASE_URL=/api/v1` and open the frontend origin. Nginx proxies `/api/` to FastAPI. A Tailscale URL must be HTTPS and must retain the `/api/v1` path for iOS.

## Automatic map generation reports unavailable

Unavailable means the local room-layout worker cannot be reached or cannot run
the selected PyTorch/MPS model. It is not a successful map with lower
confidence. Keep the previous map active and check the worker's local health
signal, its MPS availability, the backend host bridge, and the API logs. Do not
point the iPhone directly at the worker and do not substitute the LM Studio
summary model for room geometry.

The backend exposes persistent map-generation jobs and the Compose stack points
them at `ONE_GEOMETRY_SERVICE_URL` on the host bridge. Start the host-side
service in `model` mode with the real checkpoint and checked-in configuration,
then verify that `/health` reports `status: "ready"`, `mode: "model"`,
`runtime.framework: "pytorch-ultralytics"`, and an actual model version. If
the checkpoint or accelerator is missing, fix that dependency; do not replace
it with synthetic geometry.

## The iPhone cannot start the camera sweep

Use the HTTPS website origin reported by Tailscale. A phone opening
127.0.0.1 or localhost reaches the phone itself, not the Mac. In Safari,
allow camera and microphone after the explicit consent step, keep the page
open, and retry the sweep from the same setup page. If the permission was
denied earlier, open Safari website settings for the origin, set Camera and
Microphone to Allow, close the old tab, and reload.

An accepted pairing code only proves that the one-time code was exchanged. It
does not prove that camera media or sweep samples reached the backend.

## The 4175 website still shows an old build

The phone may be reaching the correct host while Docker is serving an old
frontend bundle. Rebuild and recreate the frontend from the backend Compose
project:

~~~bash
cd one
docker compose up --build -d api frontend
docker compose ps
~~~

Then hard-reload the desktop tab and reopen the HTTPS Tailscale URL on the
iPhone. Confirm that the URL points to the frontend actually bound to 4175;
another Vite or Nginx process on 4173/4174 is not the same build.

## test@test still shows a legacy map

The existing test@test data can contain a legacy map and the old manual
calibration. Those records are useful fixtures for migration, but they are not
proof of camera-derived geometry and must not unlock 3D. Check the map source,
dimension, geometry status, and metric-scale flag. If source/dimension are
absent or the source is `legacy-2d`, keep it marked rescan-required and run a
fresh guided sweep once the local worker is available. Do not delete the
historical row just to make the dashboard look empty.

## Inference provider connection fails

Inference is disabled by default in the local `.env` (`ONE_LLM_ENABLED=false`),
so this is expected until you explicitly enable it. For LM Studio, check that
it is serving an OpenAI-compatible `/v1` endpoint, that `ONE_LM_STUDIO_URL`
includes `/v1`, and that the configured model is exactly
`qwen3.6-35b-a3b`. For OpenRouter or another compatible gateway, check
`ONE_LLM_BASE_URL`, `ONE_LLM_MODEL`, `ONE_LLM_PROVIDER`, and the local-only
`ONE_LLM_API_KEY`. Never put a provider key in the frontend or a committed
file. The adapter’s deterministic fallback is expected when a provider is
disabled, unavailable, rate-limited, or returns an invalid response.

## Camera permission is denied

The browser publisher asks for permission only after the explicit consent checkbox. Re-enable camera and microphone for the origin in browser settings, reload, and retry. A demo placeholder is not evidence of a live stream.

## The website does not open on a phone

`127.0.0.1` is the Mac itself, not the phone. Keep the frontend loopback-bound
and proxy it privately with Tailscale:

```bash
tailscale serve --bg http://127.0.0.1:4175 # use the actual ONE_FRONTEND_PORT
tailscale serve --bg --https=8444 http://127.0.0.1:7880
tailscale serve status
```

Open the website HTTPS URL shown by `tailscale serve status`. Set the backend
`ONE_LIVEKIT_URL` to the corresponding `wss://<tailnet-host>:8444` URL and
restart the API before testing camera publishing. If you intentionally use a
same-Wi-Fi HTTP test, set `ONE_FRONTEND_BIND=0.0.0.0` and open the Mac LAN IP;
camera APIs may still refuse that insecure origin, so Tailscale HTTPS is the
recommended path.

## RoomPlan is unavailable

RoomPlan requires supported Apple hardware and a native iOS client; Simulator
intentionally reports unsupported. Safari cannot capture RoomPlan or create a
LiDAR artifact. A non-LiDAR device can use the camera-derived 2D path, but it
must never unlock the 3D view. The current native slice can start a capture
session, while durable RoomPlan serialization and strict LiDAR upload still
need to be implemented and verified on a physical device. The backend rejects
incomplete or non-LiDAR RoomPlan payloads with 422.

## “PostgreSQL is configured” but requests fail

Check that the `postgres` service is healthy and that the API URL uses the same database, user, and password as `ONE_POSTGRES_*`:

```bash
docker compose ps postgres
docker compose logs --tail=80 postgres
curl -s http://127.0.0.1:8000/api/v1/health
```

The API applies `migrations/001_initial.sql` and `migrations/002_family_mode.sql` on startup and reports `database_status=ok` only after the connection succeeds. A local manual run needs `pip install -e '.[postgres]'`; the Docker image already installs that extra. Do not point a container at `127.0.0.1` for PostgreSQL—the Compose hostname is `postgres`.

## Family or medication controls look empty

The backend has consent-gated family, medication plan, reminder, check-in, and
family-assistant routes. In live mode, complete onboarding's `family_mode` and
`medication_management` choices for the selected subject, then reload the Family
view. Plans created there are persisted in PostgreSQL; archiving sets
`active=false` so history is retained. Demo rows appear only when
`VITE_DEMO_MODE=true` (or the iOS runtime is explicitly configured for demo).

## Vocs reports a missing export from a browser dependency

Run the docs through the repository scripts rather than invoking Vocs directly:

```bash
npm run dev
npm run build
```

The wrapper keeps Mermaid's CommonJS dependencies (`dayjs`,
`@braintree/sanitize-url`, and `fastdom`) in Vite's browser optimizer and
bridges the sanitizer's named export. This avoids browser errors such as
`does not provide an export named default` or `sanitizeUrl` after a fresh
dependency install.
