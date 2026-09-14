# iOS & RoomPlan

The iOS app is a native SwiftUI vertical slice with resident, caregiver, and family-care-circle surfaces:

- **Caregiver:** Overview, Map, Events, Family, and Account tabs.
- **Resident:** Today, Assistant, and Account tabs.
- **Family:** Care-circle members, least-privilege roles, shared medication reminders, and caregiver assistant actions.

`AppStore.demo` seeds the UI with a home map, zones, a blue mug object, sample events, consent records, multiple caregiver accounts, and medication doses. In live mode, authentication begins with a focused welcome choice for sign in, account creation, or household invitation. Account creation records whether the care space is a private home or residence and whether its support focus is general or MCI-oriented; the onboarding copy keeps that context grounded in personal baselines, consent, and human follow-up rather than diagnosis. Email sign in then advances to a dedicated short-lived code confirmation screen with change-email and resend actions. Invitation acceptance, session restoration in Keychain, onboarding consent writes, and logout use the FastAPI contract. Email identity is the durable care-space boundary when a person changes phones; camera pairing remains a separate device-scoped flow. The local development outbox exposes a one-time code because no mail subscription is required for the MVP.

The native app does not currently run as the backend `publisher` role or as a
continuous camera source. A caregiver can, however, open **Home → Cameras →
Pair camera** to create a real publisher credential, see the one-time code, and
poll its `pending` / `connected` / `expired` state. Once connected, the native
Cameras section reads the enabled camera list and displays the backend-reported
online/paused state. An iPhone used as the fixed household or residence camera
still opens the web `/join` publisher flow in Safari to publish media. The
native app remains the caregiver/resident experience and the LiDAR RoomPlan
producer. See [Add a phone as a camera](/guide/camera-setup).

`RuntimeConfiguration` reads `ONE_API_BASE_URL` from the generated Info.plist. Any configured URL, including the default `http://127.0.0.1:8000/api/v1`, is live; demo data is reserved for previews and tests that omit the value. For a tailnet deployment, set the build setting to the Tailscale HTTPS URL plus `/api/v1`; keep certificates and tokens out of source control. Session material belongs in the Keychain abstraction, and local artifacts can use the AES-GCM helper.

## Care-space management parity

Home and Account both expose the same active care-space entry. Opening it shows
the account's homes and residences, while creation stays in a focused native
sheet. After a successful switch or creation, iOS persists the replacement
session, clears data scoped to the previous care space, rebuilds the
authenticated client, returns to Home, and refreshes the new context. A failed
switch keeps the previous session and cached home usable; a failed membership
list remains a retryable inline state rather than signing the person out.

Onboarding completion is keyed by both home ID and user ID. A newly created
care space therefore enters its own privacy onboarding, while switching back to
a space already completed by that user does not repeat it. The Family surface
also manages the people receiving care for the active space independently from
the people who have ONE access, so a household can contain a couple and a
residence can contain several care recipients without creating login accounts.

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
otherwise checks `RoomCaptureSession.isSupported`. LiDAR-capable hardware uses
this higher-accuracy RoomPlan path. Non-LiDAR iPhones can instead use the guided
ARKit video capture described below to create an explicitly approximate metric
3D room model.

The native scan is the only producer that can qualify for the
roomplan-lidar-3d contract. A valid upload must preserve RoomPlan provenance,
schema version, LiDAR capability, metric units, up axis, coordinate frame, and
actual 3D surfaces or objects. The web client cannot create, infer, or
extrude this artifact.

The scan is presented as a local artifact until the user chooses to share it.
Room maps should be treated as approximate spatial memory, not a survey-grade
map. A scan that lacks the strict provenance and geometry fields is retained as
local/demo data and must not unlock the web 3D view.

The native producers are wired end to end. `RoomPlanCapability.isSupported`
requires RoomPlan support and mesh scene reconstruction. Devices without LiDAR
must never claim `roomplan-lidar-3d`; they use the separate
`arkit-video-3d` provenance when guided ARKit capture is available. Simulator
remains unsupported for real sensor acceptance.

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

## Non-LiDAR guided ARKit video capture

On iPhones that cannot run RoomPlan, ONE can guide the user through a room
video scan using ARKit tracking and detected planes. The app records bounded
metric surfaces in the ARKit world frame and uploads them through
`POST /api/v1/homes/{home_id}/maps/arkit-video`.

The resulting revision is always explicit about its weaker provenance:
`source=arkit-video-3d`, `coordinate_frame=arkit-world`, and
`approximate=true`. The backend derives a structural room model from those
surfaces and generates the USDZ used by the iOS and web 3D viewers. The same
revision can also drive the web top-down 2D view, so both clients use the same
room shape instead of inventing independent geometry.

This fallback is approximate metric context, not RoomPlan accuracy. A valid
`roomplan-lidar-3d` revision remains preferred and must not be silently
replaced or downgraded by a later ARKit-video scan. Fixed-camera registration,
camera frustums, and RoomPlan landmark localization remain RoomPlan-only in the
current implementation.

## Native privacy surface

The Account/Settings view exposes purpose-level consent, pause/resume controls, export, deletion requests, and session logout. The Family view lets an authorized person edit a non-owner member's live role or swipe to reveal a destructive access-removal action; confirmation is required, self/owner changes are blocked, and the backend revokes removed sessions. `PrivacyInfo.xcprivacy` is part of the target. Native demo behavior and backend-backed behavior are separate validation steps.

While the native Map view is visible, `AppStore.refreshMapData()` refreshes the
scene and derived room objects every two seconds. RealityKit keeps the cached
RoomPlan USDZ mounted and rebuilds only its lightweight camera/person overlays,
so fresh concurrent-person observations appear without reloading the room
asset. Person markers remain intentionally transient and disappear after the
same 12-second live-map window used by the web renderer.

## Styling tokens

`OneTheme` centralizes adaptive canvas, surface, inverse-surface, ink, secondary ink, blue, cyan, mint, and amber tokens. The app keeps dark inverse surfaces for camera/assistant cards while adapting the canvas and text to light/dark traits. `LiquidGlassControl` uses `glassEffect` on iOS 26 and a material fallback on earlier systems.

Authentication and onboarding use a restrained, content-first visual system:
an adaptive plain canvas, a centered width-limited content column, strong
editorial hierarchy, quiet outlined controls, generous whitespace, and a
single clear primary action. Authentication progressively reveals only the
chosen form and then the email-code confirmation state. Onboarding keeps one
purpose per page with a compact progress header, explicit Allow/Not now
choices, page indicators, and a clear Continue/Finish action.

The project targets iOS 26.0. RoomPlan must be validated on a physical
LiDAR-capable device, while the `arkit-video-3d` fallback needs acceptance on a
physical non-LiDAR iPhone. Safari still uses the browser camera-derived 2D path
and cannot create either native 3D provenance. See
[Camera mapping](/architecture/camera-mapping) for the source and dimension
boundary.
