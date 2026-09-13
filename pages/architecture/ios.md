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

The native producer is wired end to end. `RoomPlanCapability.isSupported`
requires RoomPlan support and mesh scene reconstruction; Simulator and
non-LiDAR devices remain on the explicit 2D/legacy state. A real 3D source
still requires a physical LiDAR-capable iPhone or iPad.

## Native LiDAR implementation

When capture ends, the app keeps `CapturedRoomData`, builds a `CapturedRoom`
with `RoomBuilder`, and normalizes every supported RoomPlan element type:
walls, floors, openings, doors, windows, objects, transforms, dimensions,
confidence, and sections. The canonical payload is
`roomplan-normalized.v1` with metric units, Y-up, and the `roomplan-local`
coordinate frame. The native path preserves actual RoomPlan geometry; it does
not extrude camera polygons, infer metric scale from RGB, or manufacture 3D
boxes. See Apple's [RoomPlan overview](https://developer.apple.com/documentation/roomplan),
[`CapturedRoom`](https://developer.apple.com/documentation/roomplan/capturedroom),
and [`CapturedRoomData`](https://developer.apple.com/documentation/roomplan/capturedroomdata).

The upload sequence is deliberately separate from the browser map route:

1. `POST /api/v1/homes/{home_id}/maps/roomplan` stores the validated
   structured RoomPlan JSON and returns `source=roomplan-lidar-3d` and
   `dimension=3d`.
2. `PUT /api/v1/homes/{home_id}/maps/{map_id}/usdz` optionally persists the
   exported USDZ attachment through the authenticated, idempotent boundary.
3. `GET /api/v1/homes/{home_id}/scene` refreshes the saved scene. The native
   viewer uses RealityKit for the USDZ only when source, dimension, geometry,
   and readiness all match the strict 3D gate.

The structured RoomPlan JSON remains canonical. USDZ is a richer viewer
attachment, bounded to 50 MiB, validated as a safe ZIP package, and addressed
under the home/map object-store key. Missing or failed USDZ attachment or
download produces a retryable 3D asset state; it never falls back to a
fabricated 3D or 2D representation of the native scan. Generic map uploads
and Safari camera sweeps always remain `legacy-2d` or `camera-cv-2d`.

XCTest covers normalization, finite geometry, dimensions, metadata, exact
routes, attachment upload/download, and the simulator capability gate. A
physical LiDAR device is still required for acceptance of the sensor capture,
RoomBuilder conversion, both authenticated uploads, scene reload, and USDZ
rendering; simulator tests cannot prove that hardware path.

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
