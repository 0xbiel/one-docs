# Troubleshooting

## `401 Bearer session required` or `Session expired`

Pairing completion returns the only bearer token for that session. Send it as `Authorization: Bearer <token>` and do not reuse an expired or logged-out token. The web client stores its demo/live session identifiers in `sessionStorage`.

## `403 Active video_capture consent is required`

Consent is an execution gate. Grant the `video_capture` purpose for the home and confirm the home is not paused before submitting frames or creating a LiveKit token.

## CORS errors from Vite

Set `ONE_CORS_ORIGINS` to the exact Vite origin, for example `http://localhost:5173`. Restart Uvicorn after changing `.env`.

When using Docker, do not set a hard-coded API host in the browser: use `VITE_API_BASE_URL=/api/v1` and open the frontend origin. Nginx proxies `/api/` to FastAPI. A Tailscale URL must be HTTPS and must retain the `/api/v1` path for iOS.

## LM Studio connection fails

Check that LM Studio is serving an OpenAI-compatible `/v1` endpoint, that `ONE_LM_STUDIO_URL` includes `/v1`, and that the configured model is exactly `qwen3.6-35b-a3b`. Authentication keys belong only in local environment variables. The adapter’s deterministic fallback is expected when the local service is unavailable.

## Camera permission is denied

The browser publisher asks for permission only after the explicit consent checkbox. Re-enable camera and microphone for the origin in browser settings, reload, and retry. A demo placeholder is not evidence of a live stream.

## RoomPlan is unavailable

RoomPlan requires supported Apple hardware; Simulator intentionally reports unsupported. The iOS flow retains a manual-zone fallback so the product can still represent approximate places.

## “PostgreSQL is configured” but requests fail

The setting is accepted as deployment intent, but the repository’s complete adapter is SQLite. Keep local runs on SQLite until migrations and the PostgreSQL implementation are added.

## Family or medication controls look synthetic

The backend has consent-gated family, medication plan, reminder, check-in, and family-assistant routes. The web and iOS surfaces currently seed household people and dose rows in local/demo state; add a live adapter and persistence verification before describing a reminder as remotely saved.
