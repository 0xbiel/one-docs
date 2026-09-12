# iOS & RoomPlan

The iOS app is a native SwiftUI vertical slice with resident, caregiver, and family-care-circle surfaces:

- **Caregiver:** Overview, Map, Events, and Privacy tabs.
- **Resident:** Today, Assistant, and Privacy tabs.
- **Family:** Care-circle members, least-privilege roles, shared medication reminders, and caregiver assistant actions.

`AppStore.demo` currently seeds the UI with a home map, zones, a blue mug object, sample events, consent records, multiple caregiver accounts, and medication doses. Family/medication controls are demo state in this vertical slice; they expose the seam for a future backend client.

`RuntimeConfiguration` reads `ONE_API_BASE_URL` from the generated Info.plist and otherwise uses `http://127.0.0.1:8000/api/v1` in demo mode. For a tailnet deployment, set the build setting to the Tailscale HTTPS URL plus `/api/v1`; keep certificates and tokens out of source control. Session material belongs in the Keychain abstraction, and local artifacts can use the AES-GCM helper.

## RoomPlan capture

`RoomPlanCaptureView` wraps `RoomCaptureView` and delegates completion to `RoomBuilder`. `RoomPlanCapability.isSupported` returns false on Simulator and otherwise checks `RoomCaptureSession.isSupported`. When unavailable, the UI explains that LiDAR is not available and offers a manual-zone path.

The scan is presented as a local artifact until the user chooses to share it. Room maps should be treated as approximate spatial memory, not a survey-grade map. The backend stores a revisioned map artifact and coordinate-frame metadata when a map is submitted.

## Native privacy surface

The Settings view exposes purpose-level consent, pause/resume controls, export, and deletion requests. `PrivacyInfo.xcprivacy` is part of the target. Native demo behavior and backend-backed behavior are separate validation steps.

## Styling tokens

`OneTheme` centralizes adaptive canvas, surface, inverse-surface, ink, secondary ink, blue, cyan, mint, and amber tokens. The app keeps dark inverse surfaces for camera/assistant cards while adapting the canvas and text to light/dark traits. `LiquidGlassControl` uses `glassEffect` on iOS 26 and a material fallback on earlier systems.

The project targets iOS 26.0 and RoomPlan must be validated on a physical LiDAR-capable device. Simulator and non-LiDAR devices use the manual-zone fallback.
