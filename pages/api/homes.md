# Homes, rooms & calibration

All operations in this page require a bearer session and a membership in `{home_id}`. Publisher memberships are blocked from home-control endpoints. IDs are opaque strings from the API; examples use `home_demo` only as a placeholder.

## Identity and runtime

### `GET /api/v1/me`

Operation ID: `me_api_v1_me_get`. Returns the authenticated actor, their home and resident display name, the first configured device (if present), and whether runtime processing is paused.

### `GET /api/v1/homes/{home_id}/runtime`

Operation ID: `runtime_api_v1_homes__home_id__runtime_get`. Returns `{ home_id, paused, video_capture_consented }`. A revoked `video_capture` consent pauses the runtime flag; it does not imply that historical rows are erased.

## Cameras

### `GET /api/v1/homes/{home_id}/cameras`

Operation ID: `cameras_api_v1_homes__home_id__cameras_get`. Returns `{ data: [...] }` with camera read models.

### `POST /api/v1/homes/{home_id}/cameras`

Operation ID: `camera_api_v1_homes__home_id__cameras_post`. Request (`CameraIn`) requires `name` (1–120 chars) and accepts nullable `room_id`. Creates an enabled camera and returns its ID, fields, and `enabled: true`.

## Rooms

### `GET /api/v1/homes/{home_id}/rooms`

Operation ID: `rooms_api_v1_homes__home_id__rooms_get`. Returns `{ data: [...] }` ordered by creation time.

### `POST /api/v1/homes/{home_id}/rooms`

Operation ID: `room_api_v1_homes__home_id__rooms_post`. Request (`RoomIn`) requires `name` (1–120 chars). Returns the created room ID and name.

## Maps and scene

The target map read model carries explicit source and dimension metadata. The
dashboard uses this gate once those fields are available:

| Source | Dimension | Meaning |
| --- | --- | --- |
| camera-cv-2d | 2D | Relative polygons and walls generated from the paired camera sweep |
| roomplan-lidar-3d | 3D | Native RoomPlan geometry from a LiDAR-capable iPhone or iPad |
| legacy-2d | 2D | Older provisional/manual data that needs a fresh camera sweep |

### `GET /api/v1/homes/{home_id}/maps`

Operation ID: `maps_api_v1_homes__home_id__maps_get`. Returns the stored map
read models, newest revision first. The current response includes the map
record, map data, coordinate frame, source, approximate flag,
localization status, metadata, and revision.

### `GET /api/v1/homes/{home_id}/maps/current`

Operation ID: `current_map_api_v1_homes__home_id__maps_current_get`. Returns
the newest map read model or `404 No room map has been uploaded`.

### `GET /api/v1/homes/{home_id}/maps/{map_id}`

Operation ID: `map_detail_api_v1_homes__home_id__maps__map_id__get`. Returns one
map read model or `404 Map not found`.

### `GET /api/v1/homes/{home_id}/scene`

Operation ID: `scene_api_v1_homes__home_id__scene_get`. The current response
contains `sceneId`, `version`, `source`, `dimension`, `geometryStatus`,
`rescanRequired`, `zones`, `polygons`, `walls`, `camera`, `confidence`, `mapId`,
and `coordinateFrame`. An empty home returns a null scene with version zero and
`rescanRequired: true`.

### `POST /api/v1/homes/{home_id}/maps/provisional`

Operation ID: `provisional_map_api_v1_homes__home_id__maps_provisional_post`.

The compatibility route accepts `camera_id`, optional `room_id`, source
resolution, and caller-supplied zones. It stores `legacy-2d` data with
`approximate=true` and `localization_status=rescan-required`. It does not call
the room-layout service and never invents missing bounds.

### Automatic camera map generation

The paired publisher starts a bounded generation job after recording its own
`video_capture` consent:

```text
POST /api/v1/homes/{home_id}/cameras/{camera_id}/map-generation
GET  /api/v1/homes/{home_id}/cameras/{camera_id}/map-generation
POST /api/v1/homes/{home_id}/cameras/{camera_id}/map-generation/{job_id}/frames
GET  /api/v1/homes/{home_id}/cameras/{camera_id}/map-generation/{job_id}
```

The start body requires `resolution_width` and `resolution_height`, and accepts
`room_id`, `room_label`, and `orientation`. The frame body contains 3–20
`frame_base64`, `width`, `height`, and optional `captured_at` entries. A frame
is limited to 3 MB after decoding and a batch to 18 MB. The publisher can only
submit frames for its own camera; caregivers/admins can read status. The job
states are `collecting`, `processing`, `ready`, `needs_rescan`, `unavailable`,
and `failed`. Only `ready` creates a new map revision.

### `POST /api/v1/homes/{home_id}/maps/roomplan`

Operation ID: `roomplan_map_api_v1_homes__home_id__maps_roomplan_post`.

The handler accepts `normalized_scan` plus required `scan_metadata` fields:
`provenance=native-roomplan`, `device_model`, `lidar=true`,
`roomplan_version`, metric `units`, `up_axis=Y`, and `geometry_type=3d`. The
scan itself must contain actual 3D vectors/vertices and the same metric/up-axis
declarations. Missing provenance, missing LiDAR evidence, malformed geometry,
or a browser payload returns `422`. A browser client must never call this route
to turn an RGB map into 3D.

### `POST /api/v1/homes/{home_id}/maps`

The generic map upload accepts `map_data`, optional `room_id`, and a coordinate
frame, then stores source `legacy-2d` with `rescan-required`. It is a
compatibility boundary for existing clients; it cannot unlock the 3D view.

## Camera pose, not fake calibration

The required automatic camera result stores a relative camera pose, image-space
transform, homography or reprojection error where available, and confidence. It
does not report an invented accuracy in meters: RGB-only mapping has no
reliable metric scale.

The existing `POST /api/v1/homes/{home_id}/calibrations` endpoint accepts
intrinsics and extrinsics for compatibility with older clients. Camera-derived
jobs store model metrics and `accuracy_m=null`; RGB calibration does not claim
meter accuracy. Legacy manual records, three-anchor UI, hardcoded meter values,
and provisional maps are rescan-required and are not the source of a current
camera-derived map.
