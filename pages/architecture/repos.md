# Repository map

The three repositories are intentionally separate. This page is based on the current checkout, not a future roadmap.

| Repository | Purpose | Start with |
| --- | --- | --- |
| `one` | FastAPI backend, PostgreSQL/SQLite schema adapters, media/vision primitives, Docker wiring, privacy note | `README.md`, `app/main.py`, `app/config.py`, `migrations/` |
| `one-frontend` | React/Vite caregiver dashboard and browser publisher | `src/app/App.tsx`, `src/api/client.ts`, `src/api/sse.ts` |
| `one-ios` | SwiftUI caregiver/resident app and RoomPlan capture surface | `One/Views.swift`, `One/AppStore.swift`, `One/RoomPlanCaptureView.swift` |
| `one-docs` | This Vocs documentation site | `vocs.config.ts`, `pages/` |

## Backend modules

- `main.py`: route composition, auth dependency, consent gates, pairing, care-recipient face profiles, medication plans/check-ins, daily check-ins/analytics, fall events/snapshots, family assistant, and privacy handlers.
- `db.py`: PostgreSQL query adapter with SQLite zero-setup fallback, qmark portability, transactional migration tracking, and health checks.
- `security.py`: secret hashing, pairing-code/token generation, expiry helpers.
- `analytics.py`: bounded daily-check-in and fall-safety aggregates plus the assistant context allow/deny boundary.
- `face.py`: encrypted-template validation, conservative matching, and temporal identity stability helpers.
- `fall.py`: stable person-track posture transition heuristic that produces reviewable fall signals.
- `vision.py`: injected detector contract, deterministic detector, temporal tracker, projection and zone fallback.
- `media.py`: bounded ring buffer and AES-GCM encrypted local clip store.
- `integrations.py`: LM Studio request and bounded family-assistant adapters, plus LiveKit JWT/webhook helpers.
- `events.py`: in-process event bus and server-sent-event formatting.
- `storage.py`: local JSON/object storage primitive.

## Client boundary

The web API client exposes live `/api/v1` reads for `/me`, cameras, scene/maps, objects, events, consent, privacy, LiveKit token issuance, family members, and subject-scoped medication reminders. The web and iOS demo stores still include synthetic presentation rows for offline previews; live auth, invitations, onboarding consent, logout, and the backend persistence boundary remain separate from those fixtures.

`one/contracts/openapi.json` is generated from the FastAPI app by
`one/scripts/generate_openapi.py`. The frontend’s `npm run generate:api`
consumes the sibling artifact when the repositories are checked out together
and otherwise uses its pinned `contracts/openapi.json` snapshot; CI checks the
generated `src/api/schema.d.ts` for drift. `one-ios/contracts/openapi.json`
pins the same reviewed contract for standalone inspection while the current
Swift transport remains a small manual adapter. Update both snapshots and
their clients when the backend contract tag changes.
