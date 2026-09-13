# Browser camera pairing

The browser camera is a deliberate boundary: pair, consent, preview, guided
sweep, then publish.

1. A caregiver starts a device-only pairing from the dashboard. The backend creates a short-lived code through `POST /api/v1/homes/{home_id}/pairing/start`; this is intentionally separate from joining a household with an email invitation.
2. The publisher enters the code and calls `POST /api/v1/pairing/complete`. The code is single-use and the response contains a session token.
3. The publisher checks the explicit camera/microphone consent box.
4. Only then does the browser call `getUserMedia` and show the preview.
5. The publisher completes the guided 8–12 second room sweep. The browser
   submits bounded RGB samples for the paired camera and then keeps the camera
   in its fixed position.
6. Live mode requests `POST /api/v1/homes/{home_id}/livekit/token`, then connects
   to the returned room. Demo mode stays local to the browser.

The caregiver stays on the dashboard pairing modal while the publisher completes
setup. The modal polls `GET /api/v1/homes/{home_id}/pairing/{pairing_id}/status`
and shows `pending`, `connected`, or `expired` without exposing the code again.
Connected means the one-time code was accepted; it is not proof that camera
media is flowing until the LiveKit publisher presence is observed. After the
preview is stable, the same setup sheet shows `collecting`, `processing`,
`ready`, `needs_rescan`, `unavailable`, or `failed` for map generation.

Household joining is a different, email-bound flow: an admin or caregiver sends an invitation and the recipient accepts it from `/join-household`. Household invites grant a person membership in the home; camera pairing grants a device a publisher-scoped credential. Neither code can be used in the other flow.

Pausing care stops the relevant capture path in the client and revokes the backend’s active video consent path. The backend also blocks vision and LiveKit token routes when paused or when consent is missing. Browser permissions, a local network, TLS, and a real LiveKit deployment are separate operational requirements.

## Camera-derived 2D map

The sweep is an RGB-only input to the real local YOLOv8-World v2 room-layout
service. It produces a relative camera-room-2d map: polygons, wall segments,
detected furniture, detected doors/windows, a relative camera pose, confidence,
and model metadata. It does not produce a metric floor plan and it does not
become a 3D model. Raw sample frames are temporary processing input; only the
derived map revision and job metadata are retained.

The caregiver does not tap left, center, or right anchors. If the worker cannot
reach the configured confidence threshold, the job ends as `needs_rescan` and
the previous map remains active. A legacy map with only zone labels or
hardcoded rectangles must be labeled rescan-required.

## Browser and RoomPlan boundary

Safari can request camera and microphone access from an HTTPS origin, including
the private Tailscale origin. Safari cannot capture Apple RoomPlan or provide a
LiDAR RoomPlan artifact. A 3D view is therefore available only when the backend
has accepted a roomplan-lidar-3d artifact produced by the native iOS client.

The documented mapping contract and its current checkout status are collected
in [Camera mapping](/architecture/camera-mapping).
