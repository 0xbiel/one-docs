# Events, clips & streaming (overview)

For the endpoint-by-endpoint contract reference, see [Objects, vision & events](/api/observations) and [Clips & LiveKit](/api/media). Paths below include the `/api/v1` prefix.

## Events

`POST /api/v1/homes/{home_id}/observations` stores an observation with optional object/camera/map IDs, approximate coordinates, uncertainty, confidence, and detector version. It creates an `object_observed` event with a 30-day expiry and publishes an in-process event envelope. `GET /api/v1/homes/{home_id}/events` returns recent events (bounded to 1–100 items).

`GET /api/v1/homes/{home_id}/events/stream` emits server-sent events for home topics. The frontend uses `fetchEventSource` and ignores heartbeat frames. The current bus is process-local; use a durable broker before multi-instance deployment.

The event stream includes normal derived observations plus `daily_check_in` and
`fall_suspected` records. A daily check-in is the reviewable companion event
created by `POST /check-ins`. A fall signal is created only after the temporal
heuristic confirms an upright-to-low transition and is always marked
`needs_review`; it is not an emergency alert or diagnosis.

Fall events may expose `snapshot_path` and `snapshot_content_type`. The
authorized image route is:

```text
GET /api/v1/homes/{home_id}/events/{event_id}/snapshot
```

Only one encrypted event snapshot is retained for the safety episode. The
route is private/no-store and the snapshot follows event retention, privacy
export, and deletion behavior. Raw vision frames are not persisted as part of
ordinary event ingestion.

## Clips

Clip records are designed for seven-day expiry. Content is held by the encrypted local clip store when `ONE_CLIP_ENCRYPTION_KEY_B64` is configured; the API checks authorization before retrieval and the retention endpoint removes expired material. Never interpret a clip record as proof that a raw frame pipeline persists all video—the vision frame route explicitly does not persist its input.

## LiveKit

The API can issue a signed token for publish/subscribe modes when LiveKit credentials are configured. Webhook verification checks HS256 issuer/expiry and an optional body digest. The repository notes that the official `livekit-server-sdk` is not bundled; pin it for a production deployment matching the server version.
