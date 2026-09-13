# Vision & summaries (overview)

For exact operation IDs and schema constraints, see [Objects, vision & events](/api/observations) and [Check-ins & summaries](/api/checkins).

## Frame contract

`POST /api/v1/homes/{home_id}/vision/frames` accepts a camera ID, base64 frame bytes (maximum 3 MB after decode), width/height, zero to 20 candidate labels, optional capture timestamp, and optional positive depth in meters. With no labels, the backend uses enabled household-object labels and then a bounded household-item default vocabulary. Labels for face, identity, emotion, medical symptom, and diagnosis inference are rejected.

The response includes detections, a detector version, any derived observation/event IDs, `frames_persisted: false`, and a privacy note that frame bytes were processed in memory and not stored.

## Detection contract

Each detection carries a candidate label, confidence, bounding box, and projection. Temporal tracking stabilizes repeated hits. Production detection is performed by the configured local YOLO-World checkpoint through the geometry worker; an unavailable worker returns `503` rather than silently switching to a fake detector.

If the camera has an active RoomPlan registration, the projection uses its
stored camera transform and intrinsics (or a bounded FOV estimate) to intersect
the detection ray with RoomPlan floor geometry. The response can then include
`world_xyz` in `roomplan-local`, uncertainty, `quality: calibrated-floor-ray`,
and the matching `room_zone`. Without a usable registration, projection remains
an explicit approximate fallback.

## Summary contract

Check-in and caregiver-summary routes collect contextual evidence and call the LM Studio adapter when available. The configured model defaults to `qwen3.6-35b-a3b`. The adapter asks for structured JSON and validates the response; connection, parse, or model errors produce an explicit deterministic non-medical fallback. Model output is explanation support, never an authorization decision or diagnosis.

## Room geometry is a separate boundary

The current vision frame endpoint is an object-detection contract. It does not
accept a sweep job identity, sequence of room samples, camera pose, wall
geometry, or room-layout model selection, and it does not create a map. A
successful vision response is therefore not evidence that camera mapping is
available.

The automatic mapping behavior is intentionally separate: a bounded RGB sample
set is processed by the local M3 Pro room-layout worker, which returns relative
2D polygons, wall segments, camera pose, confidence, and model metadata. Raw
samples are discarded. If the worker is unavailable or confidence is too low,
the mapping result is unavailable or needs_rescan and no map revision is
created. See [Camera mapping](/architecture/camera-mapping) for the exact
behavioral contract and the current route-status boundary.

## Family assistant scope

`POST /api/v1/homes/{home_id}/family-assistant` is intentionally narrower than the check-in assistant. It sends only the selected subject’s active medication plans and up to 100 bounded check-in rows to the local model adapter. It excludes camera frames, transcripts, events, and a full household stream. The response reports whether it degraded to the deterministic `rules-family-v1` summary and always carries `medical_advice: false`.
