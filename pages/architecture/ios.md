# iOS & RoomPlan

The iOS app is a native SwiftUI vertical slice with resident, caregiver, and family-care-circle surfaces:

- **Caregiver:** Overview, Map, Events, Family, and Account tabs.
- **Resident:** Today, Assistant, and Account tabs.
- **Family:** Care-circle members, least-privilege roles, shared medication reminders, and caregiver assistant actions.

`AppStore.demo` seeds the UI with a home map, zones, a blue mug object, sample events, consent records, multiple caregiver accounts, and medication doses. In live mode, passwordless email challenge/verification, invitation acceptance tied to the invited email, session restoration in Keychain, onboarding consent writes, and logout use the FastAPI contract. Email identity is the durable household boundary when a person changes phones; camera pairing remains a separate device-scoped flow. The local development outbox exposes a one-time code because no mail subscription is required for the MVP.

`RuntimeConfiguration` reads `ONE_API_BASE_URL` from the generated Info.plist. Any configured URL, including the default `http://127.0.0.1:8000/api/v1`, is live; demo data is reserved for previews and tests that omit the value. For a tailnet deployment, set the build setting to the Tailscale HTTPS URL plus `/api/v1`; keep certificates and tokens out of source control. Session material belongs in the Keychain abstraction, and local artifacts can use the AES-GCM helper.

## Native project layout

The native target follows the same feature-oriented shape as PocketDetour so a screen can be found without searching a monolithic view file:

```text
One/
├── App/          # app entry, root routing, shared session shell
├── Core/         # design system, networking, services, RoomPlan support
├── Features/     # Authentication, Onboarding, Home, Map, Events, Family, Assistant, Settings
└── Models/       # domain and backend-facing value types
```

The folders are organizational boundaries, not separate modules: the existing XcodeGen source rule includes nested Swift files in the application target. `AppStore` remains the observable application state owner, while each feature owns its screen and local sheets/components.

## RoomPlan capture

`RoomPlanCaptureView` wraps `RoomCaptureView` and delegates completion to
`RoomBuilder`. `RoomPlanCapability.isSupported` returns false on Simulator and
otherwise checks `RoomCaptureSession.isSupported`. A physical LiDAR-capable
iPhone or iPad is required for a real 3D source.

The native scan is the only producer that can qualify for the
roomplan-lidar-3d contract. A valid upload must preserve RoomPlan provenance,
schema version, LiDAR capability, metric units, up axis, coordinate frame, and
actual 3D surfaces or objects. The web client cannot create, infer, or
extrude this artifact.

The scan is presented as a local artifact until the user chooses to share it.
Room maps should be treated as approximate spatial memory, not a survey-grade
map. A scan that lacks the strict provenance and geometry fields is retained as
local/demo data and must not unlock the web 3D view.

The current native slice can start and finish a RoomCaptureSession, but its
captured result is not yet serialized and sent through the strict RoomPlan
upload contract. Until that producer wiring is complete, the native scan is
not evidence of a durable 3D map.

## Native LiDAR implementation plan

This is the next native slice, in dependency order:

1. Gate the entry point with `RoomPlanCapability.isSupported` and a clear
   physical-device check. Simulator and non-LiDAR devices stay on the camera
   2D path.
2. Keep the `CapturedRoomData` returned by `RoomCaptureSession` instead of
   discarding it. Build a `CapturedRoom` with `RoomBuilder`, retaining the
   RoomPlan transforms and the detected walls, floors, openings, doors,
   windows, and objects. See Apple's [RoomPlan overview](https://developer.apple.com/documentation/roomplan),
   [`CapturedRoom`](https://developer.apple.com/documentation/roomplan/capturedroom),
   and [`CapturedRoomData`](https://developer.apple.com/documentation/roomplan/capturedroomdata).
3. Normalize that native result into a versioned `roomplan-lidar-3d` payload:
   actual 3D vertices/transforms, `units: "m"`, `up_axis: "Y"`, a stable
   coordinate frame, RoomPlan schema version, device model, and explicit
   `lidar: true` provenance. Do not generate boxes, infer scale from RGB, or
   convert camera polygons into 3D.
4. Add a dedicated Swift API client method for
   `POST /api/v1/homes/{home_id}/maps/roomplan` with the required
   `scan_metadata`. Treat a `422` as a local validation error and show the
   user that no 3D map was saved.
5. On a successful response, persist the returned map revision in `AppStore`,
   refresh the scene, and let the web/native map expose 3D only when the
   response is `source=roomplan-lidar-3d`, `dimension=3d`, and contains real
   RoomPlan geometry. RoomPlan supports native export when a shareable artifact
   is needed; the API upload should still be based on the validated geometry
   contract ([export documentation](https://developer.apple.com/documentation/roomplan/capturedroom/export%28to%3Aexportoptions%3A%29)).
6. Add XCTest fixtures for valid RoomPlan geometry, missing LiDAR provenance,
   non-metric units, empty geometry, and a non-LiDAR device. Finish with a
   physical LiDAR iPhone/iPad run that captures, uploads, reloads, and renders
   the same saved 3D revision.

The implementation is complete only when a reload still shows the accepted
RoomPlan revision and every invalid or non-LiDAR case remains 2D/legacy. The
camera-derived 2D flow is the fallback experience; it is not a producer for
this 3D contract.

## Native privacy surface

The Account/Settings view exposes purpose-level consent, pause/resume controls, export, deletion requests, and session logout. The Family view lets an authorized person edit a non-owner member's live role or swipe to reveal a destructive access-removal action; confirmation is required, self/owner changes are blocked, and the backend revokes removed sessions. `PrivacyInfo.xcprivacy` is part of the target. Native demo behavior and backend-backed behavior are separate validation steps.

## Styling tokens

`OneTheme` centralizes adaptive canvas, surface, inverse-surface, ink, secondary ink, blue, cyan, mint, and amber tokens. The app keeps dark inverse surfaces for camera/assistant cards while adapting the canvas and text to light/dark traits. `LiquidGlassControl` uses `glassEffect` on iOS 26 and a material fallback on earlier systems.

Onboarding follows PocketDetour's paced, single-purpose flow: a compact progress header, a large rounded illustration panel, short copy, consent cards, page indicators, and a pinned primary action. The artwork is generated from native SwiftUI `Canvas` paths and SF Symbols so it remains crisp, accessible, and free of image assets.

The project targets iOS 26.0 and RoomPlan must be validated on a physical
LiDAR-capable device. Simulator, non-LiDAR devices, and Safari use the
camera-derived 2D path or a clearly marked legacy-zone state; none of them
unlock a 3D model. See [Camera mapping](/architecture/camera-mapping) for the
source and dimension boundary.
