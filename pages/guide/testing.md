# Testing

The backend test suite uses `pytest`; the frontend uses Vitest through the Vite setup; iOS includes an XCTest target.

## Backend

```bash
cd one
source .venv/bin/activate
pytest
```

The tests cover API pairing/authentication, consent gates, event creation, clip retention behavior, vision/media contracts, temporal tracking, and encrypted clip bytes. Run them with the same Python version used by the deployment image.

The backend CI also regenerates the pinned contract and rejects drift:

```bash
python scripts/generate_openapi.py
git diff --exit-code -- contracts/openapi.json
```

The generated file at `one/contracts/openapi.json` is the API artifact consumed by the frontend type generator; treat it as source-controlled build output. The web and iOS repositories also pin reviewed snapshots under `contracts/openapi.json` so their standalone CI/builds do not depend on a sibling checkout. Compare those snapshots before publishing a new backend contract tag.

## Frontend

```bash
cd one-frontend
npm ci
npm run lint
npm test -- --run
npm run build
```

The focused tests assert backend event mapping, non-diagnostic language, app rendering, and the production/demo API boundary. A successful Vite build proves compilation; it does not prove browser permissions, camera hardware, LiveKit publisher/subscriber connectivity, same-origin proxying, or visual correctness.

## iOS

Open `one-ios/One.xcodeproj` in Xcode and run the `One` scheme on a supported iPhone. `RoomPlanCapability.isSupported` intentionally returns false on Simulator. Run the `OneTests` XCTest target for model/store coverage. A parser or simulator build cannot prove LiDAR capture behavior.
