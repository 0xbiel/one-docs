# Troubleshooting

## `401 Bearer session required` or `Session expired`

Pairing completion returns the only bearer token for that session. Send it as `Authorization: Bearer <token>` and do not reuse an expired or logged-out token. The web client stores its demo/live session identifiers in `sessionStorage`.

## `403 Active video_capture consent is required`

Consent is an execution gate. Grant the `video_capture` purpose for the home and confirm the home is not paused before submitting frames or creating a LiveKit token.

## CORS errors from Vite

Set `ONE_CORS_ORIGINS` to the exact Vite origin, for example `http://localhost:5173`. Restart Uvicorn after changing `.env`.

When using Docker, do not set a hard-coded API host in the browser: use `VITE_API_BASE_URL=/api/v1` and open the frontend origin. Nginx proxies `/api/` to FastAPI. A Tailscale URL must be HTTPS and must retain the `/api/v1` path for iOS.

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
tailscale serve --bg http://127.0.0.1:4175 # use 4173 for a fresh stack
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

RoomPlan requires supported Apple hardware; Simulator intentionally reports unsupported. The iOS flow retains a manual-zone fallback so the product can still represent approximate places.

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
