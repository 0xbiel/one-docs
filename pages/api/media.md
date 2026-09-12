# Clips & LiveKit

Media APIs are bounded demo adapters. Clips are encrypted at rest when a clip key is configured, while LiveKit credentials and a production webhook verifier must be configured explicitly.

## Clips

### `POST /api/v1/homes/{home_id}/events/{event_id}/clips`

Operation ID: `clip_create_api_v1_homes__home_id__events__event_id__clips_post`. Bearer home member; publisher blocked. Request (`ClipIn`) requires `object_key` (1–500 chars, safe `[A-Za-z0-9_./-]+` path characters and no parent traversal), `starts_at`, and `ends_at`. The handler requires the event to belong to the home, creates a seven-day-expiring record, and returns `id`, `event_id`, `expires_at`, and `download_path`.

### `GET /api/v1/homes/{home_id}/clips`

Operation ID: `clips_api_v1_homes__home_id__clips_get`. Bearer home member; publisher blocked. Returns non-expired clip records for the home, newest first.

### `POST /api/v1/homes/{home_id}/clips/{clip_id}/content`

Operation ID: `clip_content_upload_api_v1_homes__home_id__clips__clip_id__content_post`. Bearer home member; publisher blocked. Request (`ClipBytesIn`) requires `content_base64` (1–12,000,000 chars). The decoded payload must be non-empty and ≤8 MB. The response reports `encrypted: true`, byte count, and download path. Expired clips return `410 Clip expired`.

### `GET /api/v1/clips/{clip_id}/content`

Operation ID: `clip_content_api_v1_clips__clip_id__content_get`. Bearer non-publisher with home access. Returns `video/mp4` with `Cache-Control: private, no-store`; it may return `403 Clip access denied`, `410 Clip expired`, `404 Encrypted clip content not found`, or `503 Encrypted clip could not be verified`.

## LiveKit

### `POST /api/v1/homes/{home_id}/livekit/token`

Operation ID: `livekit_token_api_v1_homes__home_id__livekit_token_post`. Bearer home member. Request is optional (`LiveKitTokenIn`); `mode` defaults to `auto` and may be `auto`, `publish`, or `subscribe`. Publisher members receive publish capability (and require video consent); caregiver/admin members receive subscribe capability. The response contains `url`, a short-lived `token`, `expires_in: 600`, and resolved `mode`.

If `ONE_LIVEKIT_API_KEY`/secret are not configured, this route returns `503 LiveKit credentials are not configured`. Compose supplies the self-hosted `--dev` placeholders `devkey`/`secret`; direct runs must configure equivalent local credentials. Capability mismatches return `403`.

### `POST /api/v1/livekit/webhook`

Operation ID: `livekit_webhook_api_v1_livekit_webhook_post`. No bearer session. With credentials configured, the backend verifies the LiveKit authorization signature and returns `{ accepted: true, event }`. In non-production without credentials it returns `{ accepted: true, verified: false }`; production without verifier configuration returns `503`. Invalid signatures return `401`.

The repository currently contains a LiveKit subscriber scaffold; this route is not evidence that a complete production media plane is deployed.
