# Add a phone as a camera

ONE uses two roles during camera setup:

- The **caregiver web dashboard or native iOS app** creates and monitors the
  device pairing against the same authenticated backend state.
- The **camera device** opens ONE in Safari, accepts the one-time code, grants
  consent, completes the room sweep, and publishes the camera.

The native iOS app is a caregiver/resident client, can create and monitor a
publisher pairing code from **Home → Cameras**, and produces LiDAR RoomPlan
scans. It does **not** yet run as a continuous camera publisher. To use an
iPhone as the fixed camera today, use the browser publisher flow below. Do not
enter a camera pairing code into the native app's household sign-in form;
publisher pairing and person sign-in are different credentials.

## Before you begin

1. Start the ONE API, frontend, and LiveKit services.
2. Open the frontend through an HTTPS address reachable by both devices. The
   private Tailscale URL is the recommended physical-phone setup.
3. Sign in as the household caregiver or admin and make sure **Room and camera
   data** (`video_capture`) is allowed and care is not paused.
4. Keep the future camera phone powered and connected to the same private
   network. For automatic LiDAR placement, use that same physical iPhone for
   the native RoomPlan scan before returning it to its fixed camera position.

`localhost` on an iPhone refers to the iPhone, not the Mac running ONE. Camera
permissions also require a secure origin on a physical phone, so use the
reported Tailscale HTTPS URL rather than a Mac-only loopback URL.

## Pair the camera

On the caregiver device, use either setup surface:

1. In the web dashboard, select **Pair a camera** in the Camera connection
   section; or in the native iOS app open **Home → Cameras → Pair camera**.
2. Give the device a recognizable name and generate the six-digit code.
3. Keep the pairing sheet open. The code expires after ten minutes and can be
   used only once. Both clients poll the real pairing-status endpoint rather
   than inferring connection from general backend health.

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
   connected**. The native iOS Cameras section also refreshes its real enabled
   camera list and shows the backend-reported online/paused state.
2. On the web dashboard, optionally refine the camera name and placement, then
   select **Save camera setup**.
3. Open the live view. A connected pairing confirms the device credential; a
   visible feed confirms that LiveKit publishing is also working.

## Add the LiDAR room scan

Use a LiDAR-capable iPhone or iPad signed into the household in the native ONE
app. Automatic camera placement is available only when the scanning device is
the same physical iPhone as the paired camera. The continuous publisher still
runs separately in Safari.

1. Open **Map** in the native ONE app.
2. Select **Update room scan**. Under **Camera to position**, choose the paired
   camera only if this is that same physical iPhone. Otherwise leave **Map
   only** selected.
3. Select **Start LiDAR scan**.
4. Walk slowly around the room so RoomPlan captures the walls, floor,
   openings, and visible furniture.
5. Before finishing, hold the iPhone still in the exact position and
   orientation where the camera will remain. Finish only after tracking is
   stable.
6. Wait for ONE to save the metric scene, camera registration, and 3D asset.
   A camera-positioning failure does not discard the 3D room map.
7. Confirm **Native RoomPlan · metric 3D** and **Camera positioned**. If the app
   says **Camera needs another setup scan**, repeat with slower movement and a
   stable final pose.

The LiDAR scan may be completed before or after camera pairing. It belongs to
the household, not to the camera credential.

## Camera position and the LiDAR model

The native app now records the AR camera transform from the same RoomPlan
session and registers the selected paired camera in `roomplan-local`. The
backend accepts only the current native 3D map, an enabled camera, and a finite
4×4 `camera_to_world` transform. Limited/unavailable tracking produces
`needs_rescan`; ONE never fabricates a metric pose.

This is intentionally separate from the Safari sweep. Browser camera geometry
remains camera-relative 2D evidence and is never relabeled as RoomPlan/world
geometry. Automatic placement is valid only when the selected paired camera is
the same physical iPhone performing the LiDAR scan and the scan ends at that
camera's final fixed pose.

## What the room sweep creates

The Safari sweep creates an approximate, camera-relative **2D** map and does
not claim measured scale. The native RoomPlan scan creates the metric **3D**
map and, when the same paired iPhone is selected, its camera-to-world
registration. The two pose sources remain separate in the API.

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
