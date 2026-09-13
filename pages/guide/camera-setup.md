# Add a phone as a camera

ONE currently uses two separate surfaces during camera setup:

- The **caregiver dashboard** creates and monitors the device pairing.
- The **camera device** opens ONE in Safari, accepts the one-time code, grants
  consent, completes the room sweep, and publishes the camera.

The native iOS app is currently a caregiver/resident client and the producer
for LiDAR RoomPlan scans. It does **not** yet run as a continuous camera
publisher. To use an iPhone as the camera today, use the browser publisher flow
below. Do not enter a camera pairing code into the native app's household
sign-in form; publisher pairing and person sign-in are different credentials.

## Before you begin

1. Start the ONE API, frontend, and LiveKit services.
2. Open the frontend through an HTTPS address reachable by both devices. The
   private Tailscale URL is the recommended physical-phone setup.
3. Sign in as the household caregiver or admin and make sure **Room and camera
   data** (`video_capture`) is allowed and care is not paused.
4. Keep the future camera phone powered, connected to the same private network,
   and positioned where it has the intended room view.

`localhost` on an iPhone refers to the iPhone, not the Mac running ONE. Camera
permissions also require a secure origin on a physical phone, so use the
reported Tailscale HTTPS URL rather than a Mac-only loopback URL.

## Pair the camera

On the caregiver device:

1. Open the ONE dashboard.
2. Select **Pair a camera** in the Camera connection section.
3. Keep the pairing sheet open and copy the six-digit code. The code expires
   after ten minutes and can be used only once.

On the iPhone that will become the camera:

1. Open the same ONE HTTPS address in Safari and add `/join`, for example
   `https://one.example.ts.net/join`.
2. Enter the six-digit camera pairing code and select **Connect this camera**.
3. Read and accept the camera consent choice. Safari asks for system camera and
   microphone permission only after this step.
4. Select **Start camera**, confirm that the preview is live, and complete the
   guided 8–12 second room sweep.
5. Put the phone in its fixed position and select **Camera is in its fixed
   spot**. Keep this page open while the phone is publishing.

Back on the caregiver device:

1. Wait for the pairing state to change from **Waiting** to **Camera
   connected**.
2. Give the camera a recognizable name and placement, then select **Save camera
   setup**.
3. Open the live view. A connected pairing confirms the device credential; a
   visible feed confirms that LiveKit publishing is also working.

## Add the LiDAR room scan

Use a LiDAR-capable iPhone or iPad signed into the household in the native ONE
app. This can be the same physical iPhone before it is mounted as a camera, but
the camera publisher still runs separately in Safari.

1. Open **Map** in the native ONE app.
2. Select **Update room scan**, then **Start LiDAR scan**.
3. Walk slowly around the room so RoomPlan captures the walls, floor,
   openings, and visible furniture.
4. Finish the scan and wait for ONE to upload both the structured metric scene
   and its 3D asset.
5. Return to the map and confirm that it says **Native RoomPlan · metric 3D**.

The LiDAR scan may be completed before or after camera pairing. It belongs to
the household, not to the camera credential.

## Camera position and the LiDAR model

The current app creates two valid but separate spatial results:

- RoomPlan supplies a metric 3D room coordinate system.
- The paired camera sweep estimates a camera pose inside its own relative 2D
  coordinate system.

ONE does **not currently align those coordinate systems**, so it does not yet
place the camera automatically inside the LiDAR model. Selecting **Camera is in
its fixed spot** records the end of browser setup; it is not proof of a
LiDAR-to-camera calibration.

Reliable automatic placement requires an additional registration step that
matches camera-visible walls, openings, and furniture against the RoomPlan
geometry, solves the camera extrinsics, and rejects low-confidence matches.
Until that feature is implemented, do not move the camera after its browser
sweep and treat camera-derived locations as relative 2D evidence rather than
metric positions in the 3D model.

## What the room sweep creates

The Safari sweep creates an approximate, camera-relative **2D** map. It does
not claim measured scale and cannot unlock the 3D viewer. The native RoomPlan
scan creates the separate metric **3D** map. Having both maps does not
automatically establish the camera's 3D position.

## If it does not connect

- **Invalid or expired code:** create a fresh code from **Pair a camera**.
- **Camera permission denied:** in iPhone Settings, allow Camera and Microphone
  for Safari, reload `/join`, and try again.
- **Blank preview or no live view:** verify that the phone is on the same
  Tailnet/private network, the page is HTTPS, LiveKit is reachable, and care is
  not paused.
- **Connected but no video:** pairing succeeded, but media publishing did not.
  Leave the publisher page open and check the LiveKit endpoint separately.
- **Map says needs rescan:** repeat the guided sweep with slower movement,
  stable lighting, and a clearer view of walls and furniture.

See [Browser camera pairing](/architecture/browser-camera), [Docker
setup](/guide/docker), and [Troubleshooting](/guide/troubleshooting) for the
protocol and deployment details.
