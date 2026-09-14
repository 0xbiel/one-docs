# Web app

`one-frontend` is a Vite + React + TypeScript application. Its shell is organized around caregiver review: dashboard, family, map, events, assistant, live viewer, calibration, privacy, and a publisher route.

## Live versus demo behavior

`src/api/client.ts` reads `VITE_API_BASE_URL` and a demo-mode flag. Live mode is
the default and uses the FastAPI contract for pairing, event reads, consent,
privacy requests, and LiveKit token issuance where implemented. Demo mode
supplies deterministic scenes, objects, events, device status, pairing, and
assistant copy only when `VITE_DEMO_MODE=true` is explicitly set.

The UI also maps backend `object_observed` to “Object observed” / “non-diagnostic” language. Family mode now keeps **People receiving care** separate from **People with access**. Care-recipient profiles come from `/homes/{home_id}/care-recipients` and can be added, edited, selected, and removed without creating a user or membership; this supports multiple residents in a residence and couples in one household. Access rows continue to represent authenticated admins/caregivers/resident accounts. Medication remains on the existing user-subject contract for now, with subject-scoped reminder reads, assigned responsibility, date-aware recurrence, and acknowledgement status. In live mode, care-recipient CRUD, invitations, plan creation/editing, check-ins, and archive actions use the backend; synthetic rows appear only when `VITE_DEMO_MODE=true`. The assistant copy deliberately links answers to evidence and says “Not a diagnosis.”

The sidebar's **Caring for** control manages the active care space separately
from the care-recipient selector. It lists the authenticated identity's
households/residences with `GET /api/v1/account/homes`. Choosing another care
space calls `POST /api/v1/account/homes/{home_id}/activate`, replaces the
browser bearer/home pair, clears the selected resident, invalidates React Query
home data, and returns to the dashboard. **Add a care space** creates a new
home or residence through `POST /api/v1/account/homes`; the current identity is
its admin and the returned session becomes active immediately. The recipient
selector reads the independent care-recipient list for the active care space,
stores the selected care-profile ID separately from medication subject IDs, and
never changes the session or membership boundary.

On phone and tablet layouts the drawer shares the same rounded top-left
treatment, and its close control is absolutely positioned in the drawer header
area so it does not consume a full flex row before the care-space content. The
**Caring for** summary stops before that close-control hit area, and its
care-space menu uses compact selectable rows with restrained hover elevation so
the active-home chooser stays visually contained inside the sidebar. Help,
account settings, and sign-out now live in a profile menu opened from the header
avatar instead of using separate header buttons or a duplicate drawer footer.
The care-recipient chooser is rendered as an application listbox rather than a
native browser/OS `<select>`, so its open menu keeps the same ONE styling across
Safari, Chrome, desktop, tablet, and phone layouts. When the active care space
has no care recipients, the listbox includes an **Add person** action that opens
the Family care-profile editor directly. The shell also omits divider rules
between the header, sidebar, and main canvas so those three surfaces read as one
continuous workspace.

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
a room box. While `/dashboard/map` is mounted, the client refreshes scene,
current-map, and last-seen object data every two seconds. The RoomPlan/USDZ
model stays mounted while overlays are replaced from the latest observations,
which keeps registered-camera and concurrent-person markers close to the live
vision stream without repeatedly downloading or rebuilding the 3D model.

## Docker route

The `one-frontend` Dockerfile builds the SPA with `VITE_API_BASE_URL=/api/v1` by default and serves it from Nginx. Nginx proxies `/api/` to the `api` container, giving browser clients a same-origin base. For phone access, expose the active frontend port through Tailscale Serve; the current Compose default is `4175`. Use the resulting HTTPS origin for browser and iOS configuration. The backend's LiveKit URL must also be a phone-reachable `wss://` address; a convenient local-only setup is a second Tailscale Serve entry for `127.0.0.1:7880` on HTTPS port `8444`, then `ONE_LIVEKIT_URL=wss://<tailnet-host>:8444`. This keeps camera permissions in a secure context while retaining the self-hosted, subscription-free LiveKit.
