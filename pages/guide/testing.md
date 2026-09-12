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
