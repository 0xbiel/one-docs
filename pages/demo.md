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
3. **Open Today’s check-in.** Use Start, choose the three short answers, exercise Back/Continue, and Record the result. Explain that the bounded check-in appears as a `daily_check_in` event and is compared with the person’s own recent rhythm.
4. **Open Events.** Open a moment to show the source-linked explanation and confidence. Fall-safety signals are clearly marked “needs review”; when available, the event detail shows the single encrypted snapshot captured for that episode.
5. **Open Assistant.** Ask “Where were the keys last seen?” or “What changed from yesterday?” Live answers use bounded medication, daily check-in, and fall-safety context. Demo answers are scripted UI behavior; neither path is medical advice.
6. **Open Privacy.** Toggle a consent, pause camera and microphone, then show export/deletion controls. This is the product’s control surface, not a decorative settings page.
7. **Open Family.** Show multiple household caregiver accounts, care-recipient profiles, role badges, assigned reminder responsibility, and acknowledgement status. Explain which rows are synthetic only in demo mode.
8. **Open Join / Publisher.** Create a short pairing code, then show the explicit consent checkbox before the browser requests camera and microphone permissions.

## If you have the backend running

Set the frontend API base URL and disable demo mode. Pair a caregiver session
first, then use the returned session in the same browser. The current API
client reads `/me`, cameras, scene/maps, objects, events, analytics, daily
check-ins, consent, privacy, and LiveKit token routes. Some broader family and
medication presentation rows remain synthetic only in explicit demo mode; do
not use demo rows as evidence of remote persistence.

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
- Do not claim demo-mode rows are live backend persistence. In live mode the
  daily check-in, analytics, events, care-recipient, and assistant routes are
  backend-backed; demo mode remains explicitly synthetic.
- Do not claim a fall signal is an emergency alert, a diagnosis, or proof that
  a person needs medical attention.
- Do not imply that a demo placeholder is a real camera stream.
- Do not call a provisional zone map camera-derived geometry, and do not call
  a browser-rendered room a 3D model.
- Do not claim Safari can capture RoomPlan; 3D requires a validated native
  LiDAR artifact.
- Do not show secrets, bearer tokens, local IPs, or real resident data on screen.
