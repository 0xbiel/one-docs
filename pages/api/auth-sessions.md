# Auth, pairing & sessions

These operations create a home/member, authenticate a persistent email identity with a short-lived one-time code, exchange legacy pairing codes for a bearer session, pair a publisher device, and revoke the current session. Codes are six digits, hashed at rest, single-use, and intentionally suitable for the local MVP—not an account recovery protocol.

## `POST /api/v1/auth/email/request`

Requests a passwordless email challenge. `purpose` is `create` or `login`. Email identifiers are trimmed and case-folded before lookup and storage. `create` requires `display_name` and creates the home, membership, and runtime records before issuing the challenge; `login` selects the first non-publisher household membership for the existing email identity. The response includes a `verification_id`, normalized `email`, `home_id`, `user_id`, role, and 600-second expiry.

The local development/test response also includes `dev_code` and `delivery: development_outbox`; this is a deliberately bounded outbox because the Docker MVP has no external mail subscription. Production must connect a mail delivery adapter and must not expose `dev_code`.

## `POST /api/v1/auth/email/verify`

Accepts `{ "email": "caregiver@example.com", "code": "123456" }`. The backend hashes the code, checks the normalized email, expiry, use state, and household membership, then atomically consumes the challenge and creates a bearer session. A reused or expired code returns `400`. The email identity and membership remain the durable account boundary when a caregiver changes phones; client Keychain/session storage is only a local credential cache.

## `GET /api/v1/health`

Operation ID: `health_api_v1_health_get`. Public liveness check. The handler returns a small JSON health object; no session is required.

## `POST /api/v1/pairing/start`

Operation ID: `pairing_start_api_v1_pairing_start_post`. Creates a home, user, membership, runtime row, and a 10-minute pairing code. `X-Bootstrap-Secret` is optional in the schema: production requires the configured secret, while non-production accepts no header or the configured value.

Request (`PairStart`):

```json
{"display_name":"Demo resident","email":"demo@example.invalid","home_name":"ONE Home","role":"resident"}
```

`display_name` is required (1–120 chars). `email` is optional (max 254), `home_name` defaults to `ONE Home`, and `role` is `admin`, `resident`, or `caregiver` (default `admin`). The response contains `pairing_code`, `expires_in_seconds`, `home_id`, `user_id`, and `role`. Treat the code as secret and do not log it.

## `POST /api/v1/pairing/complete`

Operation ID: `pairing_complete_api_v1_pairing_complete_post`. Public code exchange. Request is `PairComplete`, with a required six-digit `code`. A valid code is marked used and returns `access_token`, `token_type: bearer`, `expires_in`, `home_id`, and `user_id`.

Invalid, expired, or already-used codes return `400`. The code-exchange response intentionally does not include `role`; clients should call `/api/v1/me` after storing the session when role-aware UI is needed. The bootstrap response above does include the requested role.

## `POST /api/v1/homes/{home_id}/pairing/start`

Operation ID: `device_pairing_start_api_v1_homes__home_id__pairing_start_post`. Bearer admin/caregiver operation that creates a `publisher` membership for a camera/browser/iOS device. Request (`DevicePairingStart`) accepts optional `label` or `display_name` (1–120 chars) and `expires_in_seconds` from 60 to 900 (default 600). The response includes `pairing_id`, `pairing_code`, `code`, `expires_in_seconds`, `home_id`, and `user_id`.

Publisher pairing is not a general household invite. Publisher accounts are excluded from family member lists and cannot manage home metadata.

## `GET /api/v1/homes/{home_id}/pairing/{pairing_id}/status`

Operation ID: `device_pairing_status_api_v1_homes__home_id__pairing__pairing_id__status_get`. Admin/caregiver operation used by the dashboard pairing modal. It returns the device-scoped `pairing_id`, `home_id`, expiry, `device` summary, and `status` (`pending`, `connected`, or `expired`). It never returns the pairing code. `connected` records that the one-time code was consumed; LiveKit media presence is a separate signal and is not implied by this response.

## `DELETE /api/v1/sessions/current`

Operation ID: `logout_api_v1_sessions_current_delete`. Bearer operation that deletes the session represented by the current `Authorization` header and returns `{ "ok": true }`. The backend stores only a hash of the token.

There is no password login, refresh-token, introspection, logout-all, or identity-provider endpoint. Email verification and pairing completion are the current passwordless login/session bootstrap operations. Revocation is token-specific; clients must also clear local state and disconnect SSE/LiveKit resources.

## Gates and failure modes

- Missing/non-Bearer authorization: `401 Bearer session required`.
- Expired session: `401 Session expired`.
- Revoked membership: `403 Membership revoked`.
- Wrong home: `403 Home access denied`.
- Production bootstrap mismatch: `403 Bootstrap authorization required`.
- Bad development bootstrap value: `403 Invalid bootstrap secret`.
