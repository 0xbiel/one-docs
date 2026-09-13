# Safe request examples

Examples use the same-origin `/api/v1` prefix and placeholders. Replace `TOKEN_REDACTED` and `home_demo` only in a local shell; never commit a real bearer token, bootstrap secret, invite code, clip, or `.env` value.

## Establish a session

```bash
BASE_URL=http://localhost:8000
PAIR_JSON=$(curl -sS "$BASE_URL/api/v1/pairing/start" \
  -H 'Content-Type: application/json' \
  -d '{"display_name":"Demo resident","home_name":"ONE Home","role":"resident"}')
printf '%s\n' "$PAIR_JSON" # keep local; it contains a one-time code
curl -sS "$BASE_URL/api/v1/pairing/complete" \
  -H 'Content-Type: application/json' \
  -d '{"code":"000000"}'
```

In a real shell, extract the returned code/token without printing it. The `000000` value above is intentionally non-functional.

## Record purpose-scoped consent

```bash
curl -sS -X POST "$BASE_URL/api/v1/homes/home_demo/consents" \
  -H 'Authorization: Bearer TOKEN_REDACTED' \
  -H 'Content-Type: application/json' \
  -d '{"purpose":"video_capture","policy_version":"demo-2026-09","granted":true}'
```

## Add a camera and a legacy map record

This example exercises the current generic compatibility route. It does not
create automatic camera geometry and it must not be used to claim a 3D
RoomPlan model. Use a native validated LiDAR producer for a future strict
RoomPlan upload, and use the guided sweep behavior in
[Camera mapping](/architecture/camera-mapping) for camera-derived 2D data.

```bash
curl -sS -X POST "$BASE_URL/api/v1/homes/home_demo/cameras" \
  -H 'Authorization: Bearer TOKEN_REDACTED' -H 'Content-Type: application/json' \
  -d '{"name":"Kitchen camera","room_id":null}'

curl -sS -X POST "$BASE_URL/api/v1/homes/home_demo/maps" \
  -H 'Authorization: Bearer TOKEN_REDACTED' -H 'Content-Type: application/json' \
  -d '{"coordinate_frame":"manual-2d","map_data":{"zones":[]}}'
```

## Start an automatic camera map job

The paired publisher submits the bounded sweep to its own camera job. The
caregiver can poll the same job with the `GET` route while keeping the setup
sheet open.

```bash
curl -sS -X POST "$BASE_URL/api/v1/homes/home_demo/cameras/camera_demo/map-generation" \
  -H 'Authorization: Bearer TOKEN_REDACTED' -H 'Content-Type: application/json' \
  -d '{"room_label":"Hallway","orientation":"landscape","resolution_width":640,"resolution_height":384}'

curl -sS -X POST "$BASE_URL/api/v1/homes/home_demo/cameras/camera_demo/map-generation/JOB_ID_REDACTED/frames" \
  -H 'Authorization: Bearer TOKEN_REDACTED' -H 'Content-Type: application/json' \
  -d '{"frames":[{"frame_base64":"BASE64_JPEG_REDACTED","width":640,"height":384,"captured_at":"2026-09-13T12:00:00Z"},{"frame_base64":"BASE64_JPEG_REDACTED","width":640,"height":384},{"frame_base64":"BASE64_JPEG_REDACTED","width":640,"height":384}]}'

curl -sS "$BASE_URL/api/v1/homes/home_demo/cameras/camera_demo/map-generation/JOB_ID_REDACTED" \
  -H 'Authorization: Bearer TOKEN_REDACTED'
```

The real browser sends 16 samples. The example uses the minimum three-frame
batch; the live endpoint accepts at most twenty.

## Submit a bounded vision frame

```bash
curl -sS -X POST "$BASE_URL/api/v1/homes/home_demo/vision/frames" \
  -H 'Authorization: Bearer TOKEN_REDACTED' -H 'Content-Type: application/json' \
  -d '{"camera_id":"camera_demo","frame_base64":"BASE64_FRAME_REDACTED","width":640,"height":480,"candidate_labels":["keys","mug"]}'
```

Use a real base64 payload only in a local test. Do not submit face, identity, emotion, or medical-symptom labels; the current handler rejects them.

## Invite a caregiver and create an assigned plan

```bash
curl -sS -X POST "$BASE_URL/api/v1/homes/home_demo/family/invites" \
  -H 'Authorization: Bearer TOKEN_REDACTED' -H 'Content-Type: application/json' \
  -d '{"display_name":"Demo caregiver","email":"caregiver@example.invalid","role":"caregiver","expires_in_seconds":3600}'

curl -sS -X POST "$BASE_URL/api/v1/homes/home_demo/medication-plans" \
  -H 'Authorization: Bearer TOKEN_REDACTED' -H 'Content-Type: application/json' \
  -d '{"subject_user_id":"resident_demo","name":"Example plan","dose":"1 tablet","schedule":"08:00","instructions":"Confirm with resident","active":true,"assigned_caregiver_id":"caregiver_demo"}'
```

The invitation code is returned once by the synthetic local flow. The caregiver assignment ID must reference a caregiver in the same home; the backend rejects invalid assignments. Confirm the generated OpenAPI contract has the field before shipping a typed client.

## Read events with a one-shot SSE probe

```bash
curl -N "$BASE_URL/api/v1/homes/home_demo/events/stream?once=true" \
  -H 'Authorization: Bearer TOKEN_REDACTED'
```

The response is `text/event-stream`, starts with `: connected`, emits one heartbeat, and closes when `once=true`.
