# Browser camera pairing

The browser camera is a deliberate three-step boundary: pair, consent, then publish.

1. A caregiver creates a short-lived pairing code through `POST /api/v1/pairing/start` or the Join screen.
2. The publisher enters the code and calls `POST /api/v1/pairing/complete`. The code is single-use and the response contains a session token.
3. The publisher checks the explicit camera/microphone consent box.
4. Only then does the browser call `getUserMedia`.
5. Live mode requests `POST /api/v1/homes/{home_id}/livekit/token`, then connects to the returned room. Demo mode stays local to the browser.

Pausing care stops the relevant capture path in the client and revokes the backend’s active video consent path. The backend also blocks vision and LiveKit token routes when paused or when consent is missing. Browser permissions, a local network, TLS, and a real LiveKit deployment are separate operational requirements.
