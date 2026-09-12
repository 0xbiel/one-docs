# Events, clips & streaming (overview)

For the endpoint-by-endpoint contract reference, see [Objects, vision & events](/api/observations) and [Clips & LiveKit](/api/media). Paths below include the `/api/v1` prefix.

## Events

`POST /api/v1/homes/{home_id}/observations` stores an observation with optional object/camera/map IDs, approximate coordinates, uncertainty, confidence, and detector version. It creates an `object_observed` event with a 30-day expiry and publishes an in-process event envelope. `GET /api/v1/homes/{home_id}/events` returns recent events (bounded to 1–100 items).

`GET /api/v1/homes/{home_id}/events/stream` emits server-sent events for home topics. The frontend uses `fetchEventSource` and ignores heartbeat frames. The current bus is process-local; use a durable broker before multi-instance deployment.

## Clips

Clip records are designed for seven-day expiry. Content is held by the encrypted local clip store when `ONE_CLIP_ENCRYPTION_KEY_B64` is configured; the API checks authorization before retrieval and the retention endpoint removes expired material. Never interpret a clip record as proof that a raw frame pipeline persists all video—the vision frame route explicitly does not persist its input.

## LiveKit

The API can issue a signed token for publish/subscribe modes when LiveKit credentials are configured. Webhook verification checks HS256 issuer/expiry and an optional body digest. The repository notes that the official `livekit-server-sdk` is not bundled; pin it for a production deployment matching the server version.
