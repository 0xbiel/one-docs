# Web app

`one-frontend` is a Vite + React + TypeScript application. Its shell is organized around caregiver review: dashboard, family, map, events, assistant, live viewer, calibration, privacy, and a publisher route.

## Live versus demo behavior

`src/api/client.ts` reads `VITE_API_BASE_URL` and a demo-mode flag. Live mode is
the default and uses the FastAPI contract for pairing, event reads, consent,
privacy requests, and LiveKit token issuance where implemented. Demo mode
supplies deterministic scenes, objects, events, device status, pairing, and
assistant copy only when `VITE_DEMO_MODE=true` is explicitly set.

The UI also maps backend `object_observed` to “Object observed” / “non-diagnostic” language. Family mode presents multiple household caregiver roles, a live member selector when `family_mode` is authorized, subject-scoped reminder reads, assigned responsibility, date-aware recurrence, and acknowledgement status. In live mode, invitations, plan creation/editing, check-ins, and archive actions use the backend; synthetic rows appear only when `VITE_DEMO_MODE=true`. The assistant copy deliberately links answers to evidence and says “Not a diagnosis.”

## Browser publisher

The publisher asks for `navigator.mediaDevices.getUserMedia({ video: true, audio: true })` only after consent. It stops tracks on unmount. In live mode it requests a backend-issued LiveKit token and connects with adaptive stream and dynacast; in demo mode it shows a privacy-safe placeholder. Caregivers start a publisher pairing from the dashboard: the one-time code stays in a modal with copy/regenerate controls, while the public `/join/:code` route remains the camera's separate exchange surface. After the preview is stable, the camera follows the guided 8–12 second sweep and keeps setup on the same page. `/dashboard/account` exposes the current session/home, privacy link, and explicit sign-out.

### Onboarding consent controls

Each onboarding purpose presents the two available decisions, **Allow** and
**Not now**, as one grouped row. On narrow phone viewports the same row becomes
a short horizontal scroller rather than stacking choices into separate rows;
both options remain native radio controls with visible labels and keyboard focus
states. Selecting **Not now** is a valid purpose-specific choice and does not
imply that another purpose was declined.

## Room view

The target caregiver map renders camera-derived polygons and walls as accessible
2D SVG. A 3D renderer is mounted only for a validated native
roomplan-lidar-3d artifact; browser camera geometry is never extruded into
Three.js boxes. Markers distinguish an estimated point from a zone fallback;
selecting an object exposes confidence and radius rather than false precision.
The camera map uses an accessible SVG renderer with polygons, walls, camera
pose, and confidence metadata. The former hardcoded room and anchor flow are no
longer part of the camera map surface. The Three.js renderer is a separate
LiDAR-only path and consumes validated RoomPlan geometry rather than generating
a room box.

## Docker route

The `one-frontend` Dockerfile builds the SPA with `VITE_API_BASE_URL=/api/v1` by default and serves it from Nginx. Nginx proxies `/api/` to the `api` container, giving browser clients a same-origin base. For phone access, expose the active frontend port through Tailscale Serve; the current Compose default is `4175`. Use the resulting HTTPS origin for browser and iOS configuration. The backend's LiveKit URL must also be a phone-reachable `wss://` address; a convenient local-only setup is a second Tailscale Serve entry for `127.0.0.1:7880` on HTTPS port `8444`, then `ONE_LIVEKIT_URL=wss://<tailnet-host>:8444`. This keeps camera permissions in a secure context while retaining the self-hosted, subscription-free LiveKit.
