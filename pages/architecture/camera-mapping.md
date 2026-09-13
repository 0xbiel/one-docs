# Camera mapping

ONE treats map geometry as evidence with explicit provenance. A browser camera
can produce an approximate 2D room view, but it can never qualify as a 3D
RoomPlan model.

## Two map sources

| Source | Dimension | Producer | Stored geometry | Scale | Dashboard |
| --- | --- | --- | --- | --- | --- |
| camera-cv-2d | 2D | Paired browser camera, real YOLOv8-World v2 worker, and OpenCV structural estimator | Relative polygons, wall segments, detected furniture, doors/windows, camera pose, confidence, and model metadata | Relative by default; optional caregiver reference scale; metric_scale_known=false | Accessible 2D map |
| roomplan-lidar-3d | 3D | Native iPhone or iPad RoomPlan on supported LiDAR hardware | Validated RoomPlan walls, openings, floors, objects, coordinate frame, and artifact metadata | Metric coordinates supplied by RoomPlan, still approximate | 3D view |
| legacy-2d | 2D | Older provisional or manual-zone records | Zone labels or rectangles without camera-derived geometry | Unknown | 2D only, marked for rescan |

The target map and scene responses carry source and dimension together. The web
client must not infer a 3D capability from a camera connection, a rectangle,
or a successful calibration request. Until those fields are present in the
running API, the client must treat a missing source or dimension as legacy-2d.

## Guided camera sweep

The camera device stays on the publisher setup page after pairing:

1. The caregiver creates a short-lived device code and keeps the pairing sheet
   open.
2. The camera device enters the code, records the explicit video_capture
   consent, and requests camera and microphone access from a secure origin.
3. After the preview is stable, the device performs an 8–12 second guided
   room sweep. The guide asks the user to move slowly enough to expose the
   room boundary, then place the camera in its fixed position.
4. The device submits bounded RGB samples for that camera. The caregiver page
   polls the generation resource and remains on the same setup sheet.
5. The local room-layout worker runs the configured real model on the sweep,
   derives relative polygons and walls from visible structure, and returns
   detected furniture, doors, windows, camera pose, confidence, and model
   version. Raw frame bytes are discarded after the job finishes.
6. A ready result becomes the current 2D map. There are no three-anchor buttons
   and no navigation to a separate manual calibration page.

The result is a spatial aid for reviewable observations, not a survey. RGB
alone does not provide a reliable world scale, so the 2D contract never
reports a fabricated error in meters.

## Map-generation job states

| Status | Meaning | Persistence behavior |
| --- | --- | --- |
| collecting | The paired camera is submitting samples and the worker is waiting for enough coverage | No map is replaced |
| processing | The local worker is analyzing the bounded sample set | No raw frame is written to the database or object store |
| ready | Geometry passed the configured confidence threshold and a map revision was saved | Derived geometry and metadata are retained as a map revision |
| needs_rescan | Coverage, motion, visibility, or confidence was insufficient | The old map remains; the failed sample set is discarded |
| unavailable | The local GPU worker cannot be reached or cannot run the selected model | No new map is saved; the UI explains how to restore the worker |
| failed | The request or worker failed validation or processing | The error status may be retained for support; frame bytes are discarded |

Every job is scoped to a home and camera. A paired publisher can submit frames
only with its own camera credential. A caregiver can read the status for the
paired home but cannot use a different camera ID to attach samples.

## Public endpoint status

The current backend exposes these exact map routes:

| Route | Current behavior |
| --- | --- |
| GET /api/v1/homes/{home_id}/maps | Lists stored map records, newest revision first |
| GET /api/v1/homes/{home_id}/maps/current | Returns the newest eligible real-model map or 404 when none exists; historical fixture revisions are not active |
| GET /api/v1/homes/{home_id}/maps/{map_id} | Returns one map record or 404 |
| GET /api/v1/homes/{home_id}/scene | Returns scene ID, revision, source, dimension, geometry status, zones, polygons, walls, camera pose, confidence, and map ID |
| POST /api/v1/homes/{home_id}/maps/provisional | Compatibility route; stores caller-supplied zones as legacy-2d and marks them rescan-required |
| POST /api/v1/homes/{home_id}/maps/roomplan | Accepts only strict native RoomPlan/LiDAR metadata and valid 3D geometry; incomplete payloads return 422 |
| POST /api/v1/homes/{home_id}/calibrations | Compatibility record; RGB camera generation stores model metrics with accuracy_m=null |

Automatic camera generation uses these additional routes:

| Route | Behavior |
| --- | --- |
| POST /api/v1/homes/{home_id}/cameras/{camera_id}/map-generation | Starts or returns the active collecting job; requires active video consent |
| GET /api/v1/homes/{home_id}/cameras/{camera_id}/map-generation | Returns the newest job for that camera |
| POST /api/v1/homes/{home_id}/cameras/{camera_id}/map-generation/{job_id}/frames | Accepts 3–20 bounded RGB samples; only the paired publisher may submit them |
| GET /api/v1/homes/{home_id}/cameras/{camera_id}/map-generation/{job_id} | Returns progress, terminal state, metrics, model version, and map ID when ready |

The frame endpoint accepts `frame_base64`, `width`, `height`, and optional
`captured_at`. Each frame is limited to 3 MB after decoding and the whole batch
to 18 MB. Frame bytes are held only during processing and are not written to the
database, object store, logs, or map response.

## Internal geometry-service contract

The room-layout worker is a local processing dependency, not a public API. The
backend calls the configured `ONE_GEOMETRY_SERVICE_URL` at
`POST /v1/room-layout`; its behavioral contract is:

- input is a bounded sequence of RGB frames for one authorized camera, with
  source dimensions, capture timestamps, orientation, and room label;
- processing is local to the M3 Pro host through PyTorch/MPS and the configured
  YOLOv8-World v2 checkpoint; no frame is sent to a cloud or paid vision
  provider;
- success returns normalized polygons, wall segments, detected furniture,
  door/window openings, a relative camera pose, confidence, model version,
  source resolution, and metric_scale_known=false;
- low coverage or low confidence returns needs_rescan and no new map;
- worker reachability or device failure returns unavailable and no new map;
- malformed input or an exception returns failed and frame bytes are discarded.

The checkout includes the host-side service in `one/geometry_service/`. Model
mode requires the real YOLOv8-World v2 checkpoint, its checked-in configuration,
Ultralytics/OpenCV dependencies, and a working PyTorch accelerator. If the
service is not ready, the API marks a generation job unavailable; it does not
silently switch to a rectangle, synthetic object list, or alternate fallback.
See [Real camera geometry model](/architecture/real-geometry-model) for the
installation and health contract.

## Derived 2D payload

A camera map contains the following reviewable fields:

- normalized polygon vertices and wall segments in a camera-relative frame;
- model-detected furniture items and door/window opening segments when visible;
- the relative camera pose and image-space transform used for the projection;
- a 0–1 overall confidence and per-geometry confidence where available;
- source resolution, capture interval, job ID, real room-layout model version,
  detection counts, and structural-estimation method;
- source camera-cv-2d, dimension 2d, and metric_scale_known=false.

The frontend renders this data as accessible SVG. It should not add missing
widths, heights, or positions with hardcoded rectangles. If geometry is absent,
the honest state is needs_rescan, not a convincing-looking empty floor plan.

## LiDAR-only 3D gate

The RoomPlan upload contract accepts a 3D map only when all of these facts are
present:

- the producer is the native iOS client;
- the payload identifies RoomPlan and a supported schema version;
- device capability metadata says LiDAR is available and was used;
- the geometry includes a valid coordinate frame, units, up axis, and 3D
  surfaces or objects;
- the payload passes structural validation before it becomes a map revision.

Missing provenance, missing LiDAR evidence, malformed geometry, or a browser
payload returns 422. A 2D camera map is never extruded into a 3D model. The
3D control is hidden until a validated roomplan-lidar-3d map is current.

Safari can request camera and microphone access, but it cannot run Apple
RoomPlan. RoomPlan capture and serialization must happen in the native
one-ios target on a physical supported device.

## LiDAR-to-camera registration

The browser camera pose and native RoomPlan geometry currently use independent
coordinate frames. The backend does not yet solve a transform between them,
so a paired camera is not automatically rendered at a metric position inside
the RoomPlan scene.

The intended registration stage must compare camera-visible structural
features against the native RoomPlan walls and openings, estimate camera
extrinsics in `roomplan-local`, retain reprojection and confidence metrics, and
return `needs_rescan` instead of accepting an ambiguous match. A pairing
success, a fixed-placement confirmation, or a relative RGB pose alone must not
be presented as LiDAR registration.

## Current checkout status

The native app can capture, normalize, and upload a strict RoomPlan scene and
attach its USDZ model. The paired browser flow can independently generate a
camera-relative 2D map and pose. LiDAR-to-camera registration remains
unimplemented, so the current UI must not present the relative camera pose as
an automatically located camera in the 3D RoomPlan scene. Existing
camera-provisional, roomplan-normalized, or missing-dimension records are
normalized to legacy-2d/rescan-required by the backend migration.
