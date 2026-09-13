# A little support. A more independent day.

ONE connects a calm daily check-in, approximate object memory, and human-reviewed moments for a clearer day at home. This documentation describes the runnable MVP across backend, web, and iOS.

> MIRROR → HOME → FAMILY · Local-first cognitive companion

### Start here

Run the [quickstart](/guide/quickstart), then explore the [architecture](/architecture/overview), [API](/api/overview), and [demo guide](/demo).

## What is implemented today

| Slice | Current implementation | Source of truth |
| --- | --- | --- |
| Backend | FastAPI modular monolith, SQLite adapter, versioned `/api/v1` routes, family/medication/check-in APIs | [`one/app/main.py`](https://github.com/0xbiel/one/blob/main/app/main.py) |
| Vision | Deterministic no-download detector, temporal hit tracking, calibrated-approximate projection, zone fallback | `one/app/vision.py` |
| Web | React/Vite dashboard with family mode, demo/live API modes, SSE mapping, pairing, privacy controls, camera-derived 2D map contract, and browser publisher | `one-frontend/src/` |
| iOS | SwiftUI caregiver/resident/family shells, runtime endpoint configuration, styling tokens, and RoomPlan capture when supported; native upload qualification remains separate | `one-ios/One/` |
| Inference | Optional OpenAI-compatible adapter; local LM Studio/Qwen is the default and OpenRouter/other gateways are explicit overrides; deterministic summary fallback | `one/app/integrations.py` |

> **Read the status labels carefully.** “Implemented” means code exists in this checkout. Family and medication flows are synthetic/demo state in the clients, even though bounded backend routes exist. Docker services, PostgreSQL, OWLv2 inference, and production LiveKit subscriber integration still need deployment work.

The mapping boundary is documented in [Camera mapping](/architecture/camera-mapping):
the RGB path is a relative 2D geometry job backed by the local host service,
while 3D is reserved for a validated native LiDAR RoomPlan artifact. Legacy
provisional/generic records are migrated to `legacy-2d` and marked
rescan-required, so they cannot be presented as automatic geometry or a real 3D
model.

## The path through the docs

1. Follow the [quickstart](/guide/quickstart) for the shortest local run.
2. Read the [architecture overview](/architecture/overview) to understand the trust boundaries.
3. Use the [API overview](/api/overview) when integrating a client.
4. Run the [demo guide](/demo) before presenting the product.
5. Check [known limitations](/security/limitations) before making claims about readiness.
