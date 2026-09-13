# Demo guide

This is the repeatable, honest path for a short ONE walkthrough. Docker is the
default live path once PostgreSQL health and the browser/network boundary have
been verified. Use demo mode only when you explicitly set
`VITE_DEMO_MODE=true`; use direct Vite only when iterating on the frontend.

## The four-minute story

1. **Start at Dashboard.** Show “Meaningful moments” and “Where things were last seen.” Explain that each item is an observation linked to evidence, not a diagnosis.
2. **Open Map.** Select an object and point out the confidence radius. A
   camera-derived result is an accessible relative 2D map built from the
   guided sweep. Explain that it has no reliable meter scale. Show 3D only
   when the map source is an accepted native LiDAR RoomPlan artifact; never
   use the old rectangle visualization as proof of 3D geometry.
3. **Open Events.** Open a moment to show the source-linked explanation and confidence. The current demo data is deterministic and illustrative.
4. **Open Assistant.** Ask “Where were the keys last seen?” or “What changed from yesterday?” Answers in demo mode are scripted UI behavior; a live backend can provide the local model summary path.
5. **Open Privacy.** Toggle a consent, pause camera and microphone, then show export/deletion controls. This is the product’s control surface, not a decorative settings page.
6. **Open Family.** Show multiple household caregiver accounts, role badges, assigned reminder responsibility, and acknowledgement status. Explain that the current client rows are synthetic demo state even though the backend has bounded family and medication contracts.
7. **Open Join / Publisher.** Create a short pairing code, then show the explicit consent checkbox before the browser requests camera and microphone permissions.

## If you have the backend running

Set the frontend API base URL and disable demo mode. Pair a caregiver session first, then use the returned session in the same browser. The current API client reads `/me`, cameras, scene/maps, objects, events, consent, privacy, and LiveKit token routes. The family plan UI still uses synthetic rows and future-facing visual affordances; it is not evidence of remote persistence.

For a phone walkthrough, run `docker compose up --build -d api frontend`,
then `tailscale serve --bg http://127.0.0.1:4175` and open the HTTPS URL shown by
`tailscale serve status`. The browser uses same-origin `/api/v1`; do not use
localhost on the iPhone. Set iOS `ONE_API_BASE_URL` to the HTTPS URL plus
`/api/v1`. Verify the URL and permissions before recording a demo.

For the automatic mapping story, show the consent step, the 8–12 second
guided sweep, and the same-page processing state. Only claim ready when the
local room-layout worker has returned derived polygons and confidence. If the
worker is unavailable or the result needs a rescan, say so and keep the old
map untouched.

## Claims to avoid

- Do not call object observations a diagnosis or medical prediction.
- Do not imply that the current deterministic detector is OWLv2 inference.
- Do not claim durable Redis event delivery or a production LiveKit deployment; PostgreSQL migrations are exercised locally and in CI, but backups, monitoring, and production operations still need a reviewed runbook.
- Do not claim a working LiveKit subscriber: the current client has token/publisher scaffolding and a viewer surface, but not a verified production subscriber path.
- Do not claim medication plans, caregiver invitations, or check-ins are persisted in the clients; current family data is mock/synthetic.
- Do not imply that a demo placeholder is a real camera stream.
- Do not call a provisional zone map camera-derived geometry, and do not call
  a browser-rendered room a 3D model.
- Do not claim Safari can capture RoomPlan; 3D requires a validated native
  LiDAR artifact.
- Do not show secrets, bearer tokens, local IPs, or real resident data on screen.
