# Browser camera pairing

The browser camera is a deliberate three-step boundary: pair, consent, then publish.

1. A caregiver starts a device-only pairing from the dashboard. The backend creates a short-lived code through `POST /api/v1/homes/{home_id}/pairing/start`; this is intentionally separate from joining a household with an email invitation.
2. The publisher enters the code and calls `POST /api/v1/pairing/complete`. The code is single-use and the response contains a session token.
3. The publisher checks the explicit camera/microphone consent box.
4. Only then does the browser call `getUserMedia`.
5. Live mode requests `POST /api/v1/homes/{home_id}/livekit/token`, then connects to the returned room. Demo mode stays local to the browser.

The caregiver stays on the dashboard pairing modal while the publisher completes setup. The modal polls `GET /api/v1/homes/{home_id}/pairing/{pairing_id}/status` and shows `pending`, `connected`, or `expired` without exposing the code again. `connected` means the one-time code was accepted; it is not proof that camera media is flowing until the LiveKit publisher presence is observed. The UI therefore keeps consent, preview, and calibration as explicit next steps.

Household joining is a different, email-bound flow: an admin or caregiver sends an invitation and the recipient accepts it from `/join-household`. Household invites grant a person membership in the home; camera pairing grants a device a publisher-scoped credential. Neither code can be used in the other flow.

Pausing care stops the relevant capture path in the client and revokes the backend’s active video consent path. The backend also blocks vision and LiveKit token routes when paused or when consent is missing. Browser permissions, a local network, TLS, and a real LiveKit deployment are separate operational requirements.
