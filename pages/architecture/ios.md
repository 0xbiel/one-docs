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

`RoomPlanCaptureView` wraps `RoomCaptureView` and delegates completion to `RoomBuilder`. `RoomPlanCapability.isSupported` returns false on Simulator and otherwise checks `RoomCaptureSession.isSupported`. When unavailable, the UI explains that LiDAR is not available and offers a manual-zone path.

The scan is presented as a local artifact until the user chooses to share it. Room maps should be treated as approximate spatial memory, not a survey-grade map. The backend stores a revisioned map artifact and coordinate-frame metadata when a map is submitted.

## Native privacy surface

The Account/Settings view exposes purpose-level consent, pause/resume controls, export, deletion requests, and session logout. The Family view lets an authorized person edit a non-owner member's live role or swipe to reveal a destructive access-removal action; confirmation is required, self/owner changes are blocked, and the backend revokes removed sessions. `PrivacyInfo.xcprivacy` is part of the target. Native demo behavior and backend-backed behavior are separate validation steps.

## Styling tokens

`OneTheme` centralizes adaptive canvas, surface, inverse-surface, ink, secondary ink, blue, cyan, mint, and amber tokens. The app keeps dark inverse surfaces for camera/assistant cards while adapting the canvas and text to light/dark traits. `LiquidGlassControl` uses `glassEffect` on iOS 26 and a material fallback on earlier systems.

Onboarding follows PocketDetour's paced, single-purpose flow: a compact progress header, a large rounded illustration panel, short copy, consent cards, page indicators, and a pinned primary action. The artwork is generated from native SwiftUI `Canvas` paths and SF Symbols so it remains crisp, accessible, and free of image assets.

The project targets iOS 26.0 and RoomPlan must be validated on a physical LiDAR-capable device. Simulator and non-LiDAR devices use the manual-zone fallback.
