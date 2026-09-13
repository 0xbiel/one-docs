# Testing

The backend test suite uses `pytest`; the frontend uses Vitest through the Vite setup; iOS includes an XCTest target.

## Backend

```bash
cd one
source .venv/bin/activate
# Unit tests deliberately use the zero-setup adapter, even if .env points at
# the Docker PostgreSQL hostname.
ONE_DATABASE_URL=sqlite:///./one.db pytest
```

The tests cover API pairing/authentication, consent gates, event creation, clip retention behavior, vision/media contracts, temporal tracking, and encrypted clip bytes. Run them with the same Python version used by the deployment image.

The backend CI also regenerates the pinned contract and rejects drift:

```bash
ONE_DATABASE_URL=sqlite:///./one.db python scripts/generate_openapi.py
git diff --exit-code -- contracts/openapi.json
```

The generated file at `one/contracts/openapi.json` is the API artifact consumed by the frontend type generator; treat it as source-controlled build output. The web and iOS repositories also pin reviewed snapshots under `contracts/openapi.json` so their standalone CI/builds do not depend on a sibling checkout. Compare those snapshots before publishing a new backend contract tag.

The opt-in PostgreSQL contract suite requires a disposable database URL. In
CI, PostgreSQL 16 is provided as a service; locally, point
`ONE_TEST_POSTGRES_URL` at a reachable PostgreSQL instance and run:

```bash
ONE_DATABASE_URL=sqlite:///./one.db \
ONE_TEST_POSTGRES_URL='postgresql://one:<password>@127.0.0.1:5432/one' \
  pytest -q tests/test_postgres_contract.py
```

The suite checks migrations, health reporting, qmark transactions, nullable
map queries, and foreign-key cascade deletion. It uses an unreachable LM
Studio URL and does not make inference requests.

## Mapping validation

Treat a camera map as valid only when a test can show a guided sweep reaching a
ready result, persisted relative polygons/walls, confidence and model
metadata, and discarded frame bytes. A needs_rescan, unavailable, or failed
result must leave the prior map unchanged.

Treat a 3D map as valid only when a native physical LiDAR fixture includes
RoomPlan provenance, metric units, an up axis, a coordinate frame, and valid
3D geometry. Browser RGB data, Simulator data, and generic normalized scan JSON
must not enable the 3D view. The backend tests cover valid native payloads,
malformed/non-LiDAR rejection, generic-map 3D-looking JSON, authenticated USDZ
size/type/hash/download/deletion behavior, and unchanged camera-sweep behavior.
The iOS XCTest target covers conversion of every RoomPlan element category,
finite transforms and positive dimensions, exact native routes and metadata,
USDZ upload/download, callback failures, and the Simulator capability gate.
Physical-device capture remains an iOS acceptance test.

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

Open `one-ios/One.xcodeproj` in Xcode and run the `One` scheme on a supported
LiDAR iPhone or iPad. `RoomPlanCapability.isSupported` intentionally returns
false on Simulator. Use the deployed reachable HTTPS API base URL on the
device, complete a scan, confirm the native JSON POST, USDZ PUT, scene refresh,
reload persistence, and RealityKit rendering. Run the `OneTests` XCTest target
for model/store coverage. A parser or simulator build cannot prove LiDAR
capture behavior.
