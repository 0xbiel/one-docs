# Objects, vision & events

These endpoints connect browser/iOS publishers to the bounded local vision pipeline and expose derived household evidence. Coordinates are approximate and are never a diagnosis.

## Objects

### `GET /api/v1/homes/{home_id}/objects`

Operation ID: `objects_api_v1_homes__home_id__objects_get`. Bearer home member. Returns `{ data: [...] }` with enabled object read models and latest observation projection.

### `POST /api/v1/homes/{home_id}/objects`

Operation ID: `object_create_api_v1_homes__home_id__objects_post`. Bearer home member; publisher blocked. Request (`ObjectIn`) requires `label` (1–80 chars) and optional `display_name` (max 120). Creates an enabled object.

### `GET /api/v1/homes/{home_id}/objects/last-seen`

Operation ID: `objects_last_seen_api_v1_homes__home_id__objects_last_seen_get`. Bearer home member. Returns the same object read-model shape as the object list, ordered by latest derived observation.

### `GET /api/v1/homes/{home_id}/objects/{object_id}`

Operation ID: `object_detail_api_v1_homes__home_id__objects__object_id__get`. Bearer home member. Returns one object read model or `404 Object not found`.

## Vision frame ingestion

### `POST /api/v1/homes/{home_id}/vision/frames`

Operation ID: `vision_frame_api_v1_homes__home_id__vision_frames_post`. Bearer home member with active `video_capture` consent. Request (`VisionIn`) requires `camera_id`, non-empty `frame_base64` (schema max 4,000,000 chars), positive `width` ≤7680, and positive `height` ≤4320. `candidate_labels` is optional and bounded to 20 labels; optional `captured_at` is date-time and optional `depth_m` is >0 and ≤100.

The current handler decodes and bounds the frame to 3 MB, rejects identity/medical-inference labels, and calls the configured local YOLO-World detector. Stable detections are persisted as derived observations/events; the response returns `{ data, detector_version, observations, frames_persisted: false, privacy }`. It does not write raw frame bytes to the database.

For a camera with an active `auto-roomplan-registration` or
`visual-roomplan-registration`, projection uses the stored 4×4 transform and
camera intrinsics to estimate a metric point against the RoomPlan floor. The
derived observation stores the active RoomPlan `map_id`, XYZ coordinates,
uncertainty, detector version, and confidence, and the response annotates the
projection with the matching RoomPlan room zone when one contains the point.

## Derived observations

### `POST /api/v1/homes/{home_id}/observations`

Operation ID: `observation_api_v1_homes__home_id__observations_post`. Bearer home member; publisher blocked. Request (`ObservationIn`) accepts optional `object_id`, `camera_id`, `map_id`, `x`, `y`, `z`, `uncertainty_m` (0–100), `confidence` (0–1, default 0), and `detector_version` (default `local-cv-v1`). The handler stores the row, creates an `object_observed` event with an approximate-location explanation and 30-day expiry, then publishes an in-process event. The response includes `observation_id`, `event_id`, `home_id`, and approximate location.

## Event history and SSE

### `GET /api/v1/homes/{home_id}/events`

Operation ID: `events_api_v1_homes__home_id__events_get`. Bearer home member; publishers blocked. Optional `limit` defaults to 50 and is clamped by the handler to 1–100. Returns `{ data: [...] }` newest first.

### `GET /api/v1/homes/{home_id}/events/stream`

Operation ID: `event_stream_api_v1_homes__home_id__events_stream_get`. Bearer home member; publishers blocked. Optional `once=false` keeps the process-local subscription open. The stream begins with `: connected`; `once=true` emits one `one.heartbeat.v1` event and closes. Live events use `one.event.v1`. This bus is process-local and is not a multi-instance durable broker.
