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

## RoomPlan maps and scene

### `GET /api/v1/homes/{home_id}/maps`

Operation ID: `maps_api_v1_homes__home_id__maps_get`. Returns map read models, newest revision first.

### `POST /api/v1/homes/{home_id}/maps`

Operation ID: `room_map_api_v1_homes__home_id__maps_post`. Request (`MapIn`) requires a JSON object `map_data`; optional `room_id`; `coordinate_frame` defaults to `roomplan-local` (max 80 chars). Returns `id`, revision, coordinate frame, and an artifact key.

### `GET /api/v1/homes/{home_id}/maps/current`

Operation ID: `current_map_api_v1_homes__home_id__maps_current_get`. Returns the newest map read model or `404 No room map has been uploaded`.

### `GET /api/v1/homes/{home_id}/maps/{map_id}`

Operation ID: `map_detail_api_v1_homes__home_id__maps__map_id__get`. Returns one map read model or `404 Map not found`.

### `GET /api/v1/homes/{home_id}/scene`

Operation ID: `scene_api_v1_homes__home_id__scene_get`. Returns the compact dashboard scene contract (`sceneId`, `version`, `zones`, `mapId`, `coordinateFrame`). An empty home returns `{ sceneId: null, version: 0, zones: [] }`.

## Camera-to-map calibration

### `POST /api/v1/homes/{home_id}/calibrations`

Operation ID: `calibration_api_v1_homes__home_id__calibrations_post`. Request (`CalibrationIn`) requires `camera_id`, `map_id`, object `intrinsics`, and object `extrinsics`; optional `accuracy_m` is constrained to 0–100. Returns the created ID and the submitted calibration fields. The API stores calibration metadata; it does not claim metric accuracy beyond the supplied value.
