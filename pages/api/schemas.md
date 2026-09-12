# Schemas & generated contract

The committed `one/contracts/openapi.json` is OpenAPI 3.1.0 (`ONE API`, version `0.1.0`). It currently exposes 23 component schemas. This page names each schema and the fields/constraints clients should use; the JSON contract remains the source of truth.

## Input schemas

| Schema | Used by | Required fields / important constraints |
| --- | --- | --- |
| `PairStart` | initial pairing | `display_name`; optional email/home; role `admin\|resident\|caregiver` |
| `PairComplete` | code exchange | six-digit `code` |
| `DevicePairingStart` | publisher pairing | optional label/display name; expiry 60–900 s |
| `ConsentIn` | consent record | purpose, policy version; granted defaults true; optional subject |
| `CameraIn` | camera create | name; optional room |
| `RoomIn` | room create | name |
| `MapIn` | map upload | `map_data`; optional room; `coordinate_frame` defaults `roomplan-local` |
| `CalibrationIn` | calibration | camera/map IDs, intrinsics, extrinsics; optional accuracy 0–100 |
| `ObjectIn` | object create | label; optional display name |
| `ObservationIn` | derived observation | optional IDs/coordinates; confidence 0–1; uncertainty 0–100 |
| `VisionIn` | frame ingestion | camera, base64, dimensions, 1–20 candidate labels; optional capture/depth |
| `CheckInIn` | resident check-in | optional subject; transcript max 4000 |
| `ClipIn` | clip record | safe object key, start/end timestamps |
| `ClipBytesIn` | clip upload | base64 content max 12,000,000 chars |
| `LiveKitTokenIn` | token minting | mode `auto\|publish\|subscribe`, default auto |
| `FamilyInviteIn` | invite create | display name; role resident/caregiver; expiry 300–604800 s |
| `FamilyInviteAcceptIn` | invite acceptance | six-digit code; optional display name |
| `FamilyAssistantIn` | family assistant | message max 1000; optional subject |
| `MedicationPlanIn` | plan create | subject, name, dose, schedule; optional instructions/active/`assigned_caregiver_id` |
| `MedicationPlanUpdate` | plan patch | nullable partial fields including `assigned_caregiver_id`; optional version ≥1 |
| `MedicationCheckInIn` | check-in upsert | date-time and status pending/taken/skipped/missed |

## Error schemas

`HTTPValidationError` contains `detail: ValidationError[]`, and `ValidationError` contains `loc: (string|integer)[]`, `msg`, `type`, and optional `ctx`/`input`; these are the standard FastAPI schemas emitted into the generated contract. The running backend installs a custom handler, so clients should parse the normalized runtime envelope documented in [Canonical errors](/api/operations): `error`, `request_id`, and `api_version`.

## Contract workflow

1. Change FastAPI models/routes in `one/app/main.py`.
2. Run `python scripts/generate_openapi.py` in the backend repository.
3. Review `one/contracts/openapi.json` and the generated frontend `src/api/schema.d.ts`.
4. Run backend tests and frontend typecheck/build; CI fails if generated artifacts drift.

The docs repo does not copy secrets or real environment values. Use synthetic IDs and redacted tokens in examples.
