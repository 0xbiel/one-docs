# Schemas & generated contract

The committed `one/contracts/openapi.json` is OpenAPI 3.1.0 (`ONE API`,
version `0.1.0`). This page names the current schemas and the camera-map
contract. The generated JSON contract remains the source of truth.

## Input schemas

| Schema | Used by | Required fields / important constraints |
| --- | --- | --- |
| `PairStart` | initial pairing | `display_name`; optional email/home; role `admin\|resident\|caregiver` |
| `PairComplete` | code exchange | six-digit `code` |
| `DevicePairingStart` | publisher pairing | optional label/display name; expiry 60–900 s |
| `ConsentIn` | consent record | purpose, policy version; granted defaults true; optional subject |
| `CameraIn` | camera create | name; optional room |
| `RoomIn` | room create | name |
| `MapIn` | legacy map upload | `map_data`; optional room; `coordinate_frame` defaults `manual-2d` |
| `CalibrationIn` | calibration | camera/map IDs, intrinsics, extrinsics; optional accuracy 0–100 |
| `ObjectIn` | object create | label; optional display name |
| `ObservationIn` | derived observation | optional IDs/coordinates; confidence 0–1; uncertainty 0–100 |
| `VisionIn` | frame ingestion | camera, base64, dimensions, 1–20 candidate labels; optional capture/depth |
| `CheckInIn` | resident check-in | optional subject; transcript max 4000 |
| `ClipIn` | clip record | safe object key, start/end timestamps |
| `ClipBytesIn` | clip upload | base64 content max 12,000,000 chars |
| `LiveKitTokenIn` | token minting | mode `auto\|publish\|subscribe`, default auto |
| `FamilyInviteIn` | invite create | display name; role resident/caregiver; expiry 300–604800 s |
| `FamilyInviteAcceptIn` | invite acceptance | six-digit code; optional display name |
| `FamilyAssistantIn` | family assistant | message max 1000; optional subject |
| `MedicationPlanIn` | plan create | subject, name, dose, schedule; optional instructions/active/`assigned_caregiver_id` |
| `MedicationPlanUpdate` | plan patch | nullable partial fields including `assigned_caregiver_id`; optional version ≥1 |
| `MedicationCheckInIn` | check-in upsert | date-time and status pending/taken/skipped/missed |

## Mapping contract schemas

These fields make map provenance and dimensionality explicit. They prevent the
frontend from treating a browser visualization or an old zone rectangle as a
3D model.

| Schema | Used by | Required fields / important constraints |
| --- | --- | --- |
| `CameraMapGenerationStartIn` | automatic camera sweep start | optional room/label/orientation; required positive source resolution |
| `CameraMapFrameIn` / `CameraMapFramesIn` | paired publisher samples | 3–20 frames with base64 bytes, positive width/height, optional capture time; bytes are bounded and ephemeral |
| `RoomPlanNormalizedScan` / `RoomPlanElement` | native LiDAR upload | versioned native RoomPlan geometry with walls, floors, openings, doors, windows, objects, sections, finite 4×4 transforms, positive dimensions, and metric Y-up `roomplan-local` coordinates |
| `RoomPlanScanMetadata` | native LiDAR upload | `provenance=native-roomplan`, device model, `lidar=true`, RoomPlan version, metric units, Y up-axis, and `geometry_type=3d` |
| `USDZAsset` | scene/map response | optional persisted attachment metadata: availability, SHA-256, byte count, content type, and authenticated download path |
| `RoomLayoutResult` | private geometry-service result | `camera-cv-2d`, `2d`, real-model normalized polygons/walls, detected furniture, door/window openings, relative camera pose, confidence metrics, and `metric_scale_known=false` |
| Scene | dashboard map | scene ID, revision, source, dimension, geometry status, zones, furniture, openings, optional walls/camera pose, reference scale, confidence, model version, and metric-scale flag |

The generation routes return a stable job view containing `job_id`, `status`,
`progress`, `source`, `dimension`, `metric_scale_known`, frame count,
resolution, metrics, model version, and either `map_id` or an error. The private
geometry service has its own request/response schemas in
`one/geometry_service/contracts.py` and is not exposed through the public
OpenAPI surface.

### Map-generation status values

The job status is one of:

- collecting: samples are still being accepted;
- processing: the local room-layout worker is analyzing the bounded sample set;
- ready: derived geometry passed the confidence threshold and a map revision exists;
- needs_rescan: coverage or confidence was insufficient; the previous map remains;
- unavailable: the configured local GPU worker cannot be reached or run;
- failed: request validation or processing failed.

Only ready creates or activates a new map revision. A terminal failure never
replaces the previous valid map.

### Source and dimension invariants

- camera-cv-2d always has dimension 2d and metric_scale_known=false.
- roomplan-lidar-3d always has dimension 3d and native LiDAR provenance.
- legacy-2d can be displayed in 2D for migration, but cannot enable 3D.
- A browser request that claims RoomPlan or LiDAR is rejected with 422.
- A 2D map is never extruded, padded, or converted into a 3D model by the API.
- A USDZ attachment is accepted only for a validated `roomplan-lidar-3d` map;
  it is a bounded 50 MiB ZIP attachment and does not replace the structured
  RoomPlan scene.

Example camera map metadata:

~~~json
{
  "source": "camera-cv-2d",
  "dimension": "2d",
  "geometry_status": "ready",
  "metric_scale_known": false,
  "confidence": 0.81,
  "model_version": "yolov8s-worldv2-indoor-objects-v1"
}
~~~

Example native 3D provenance:

~~~json
{
  "source": "roomplan-lidar-3d",
  "producer": "native-ios",
  "framework": "RoomPlan",
  "lidar": true,
  "units": "m",
  "up_axis": "Y",
  "coordinate_frame": "roomplan-local",
  "geometry_type": "3d"
}
~~~

## Error schemas

`HTTPValidationError` contains `detail: ValidationError[]`, and `ValidationError` contains `loc: (string|integer)[]`, `msg`, `type`, and optional `ctx`/`input`; these are the standard FastAPI schemas emitted into the generated contract. The running backend installs a custom handler, so clients should parse the normalized runtime envelope documented in [Canonical errors](/api/operations): `error`, `request_id`, and `api_version`.

## Contract workflow

1. Change FastAPI models/routes in `one/app/main.py`.
2. Run `python scripts/generate_openapi.py` in the backend repository.
3. Review `one/contracts/openapi.json` and the generated frontend `src/api/schema.d.ts`.
4. Run backend tests and frontend typecheck/build; CI fails if generated artifacts drift.

The docs repo does not copy secrets or real environment values. Use synthetic IDs and redacted tokens in examples.
