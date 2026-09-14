# Authentication and session lifecycle

This is the implementation-level reference for the current ONE authentication seam. It covers persistent passwordless email identity, pairing bootstrap, bearer sessions, client storage, route behavior, LiveKit access, and MVP limits. There is no password login, refresh-token endpoint, or external identity-provider integration in this checkout.

## Vocabulary and authority

| Term | Current meaning |
| --- | --- |
| Pairing code | Six numeric, single-use secret. Its hash is stored in `pairing_codes`; plaintext is returned once. |
| Session token | Random bearer value returned after code exchange. Only its hash is stored in `sessions`. |
| Actor | The user represented by a bearer session, including its membership role for the one active home bound to that token. The same identity may hold memberships in multiple care spaces. |
| Publisher | Restricted `publisher` membership for a camera/browser/iOS device. It can publish media but cannot administer a home. |
| Home | Tenant boundary checked on every protected home route. |

FastAPI's `auth` dependency is authoritative. It requires `Authorization: Bearer <token>`, hashes the presented token, checks expiry, then checks that membership still exists for the home recorded on that session. UI state, route URLs, the account's other memberships, and LiveKit client state do not grant access.

## Bootstrap and pairing

There are two related flows:

1. **Initial home/member bootstrap** — `POST /api/v1/pairing/start` creates a home, user, membership, runtime row, and ten-minute code. In production it requires `X-Bootstrap-Secret` matching the configured server secret. In development the header may be omitted or may contain the configured value.
2. **Publisher pairing** — an authenticated admin/caregiver calls `POST /api/v1/homes/{home_id}/pairing/start` with a label. The server creates a `publisher` membership and returns a 60–900 second code (600 by default). This is not a household-admin invite.

Both codes are exchanged at `POST /api/v1/pairing/complete` with `{ "code": "123456" }`. A valid, unexpired, unused code is marked used and creates a session:

```json
{
  "access_token": "<returned once>",
  "token_type": "bearer",
  "expires_in": 3600,
  "home_id": "<uuid>",
  "user_id": "<uuid>"
}
```

`expires_in` comes from `ONE_SESSION_TTL_MINUTES` (60 by default); it is not a refresh lifetime. The bootstrap `pairing/start` response includes the requested `role`; the code-exchange response intentionally does not, so clients use authenticated `/api/v1/me` for authoritative role. Invalid, expired, or reused codes return `400`. Do not print codes or tokens in logs, URLs, screenshots, analytics, or support tickets.

Family invitations use `family_invites` and `POST /api/v1/family/invites/accept`; an email-bound invitation must match an existing normalized email identity and then returns a bearer session for that account. The local development outbox still displays the one-time code; it is not a production email delivery provider.

### Multiple care spaces on one identity

An authenticated non-publisher identity can list its care-space memberships at
`GET /api/v1/account/homes`. Creating another household/residence with `POST
/api/v1/account/homes` adds the same user as its `admin`; activating an existing
membership uses `POST /api/v1/account/homes/{home_id}/activate`. Both mutation
routes return a fresh bearer whose `home_id` is the selected care space.

This is a session switch, not a widening of authorization. The backend checks
the target membership before issuing the new token, and every protected
`/homes/{home_id}` request still has to match the home embedded in that bearer.
The previous token remains valid until it expires or is explicitly logged out,
so clients must replace their active token/home pair atomically and clear
home-scoped cached state when switching.

Care recipients are deliberately outside this identity graph. Records under
`/homes/{home_id}/care-recipients` describe people receiving care and do not
create a `user`, membership, invitation, bearer session, or authorization role.
A residence can therefore manage many resident care profiles while granting
login access only to the staff/family accounts that actually need it.

## Protected requests and failures

The API does not use cookies for authentication. CORS permits credentials because clients set `credentials: 'include'`, but the bearer header is the actual credential:

```http
Authorization: Bearer <session-token>
Content-Type: application/json
```

Conceptually, checks are:

- missing/non-Bearer or unknown/expired token → `401`;
- missing membership → `403 Membership revoked`;
- token home differs from URL home → `403 Home access denied`;
- publisher calling a home-control route → `403 Publisher devices cannot access home controls`;
- route-specific role, subject, purpose-consent, pause, and resource checks.

Validation failures are structured `422` responses with `error`, `request_id`, and `api_version`. Success on one route does not authorize another route.

## Web login, storage, and logout UX

The React client uses the pairing code as its passwordless login. `/create-account`
is the caregiver-facing household bootstrap form; it calls `pairing/start`,
completes the returned code, and then opens onboarding. `/login` is the existing
caregiver sign-in form for a code/session. The login screen links directly to
`/create-account` for a new home and `/join-household` for an invitation; these
are live API routes, not demo shortcuts. `/join/:code` remains the public
publisher pairing surface and sanitizes input to six digits. A
successful exchange saves `one_access_token`, `one_home_id`, and `one_user_id`
in `sessionStorage`. API and SSE requests read the token and add a bearer
header. On reload, `GET /api/v1/me` validates the session before protected data
queries run. `api.logout()` attempts `DELETE /api/v1/sessions/current`, then
clears all browser session storage in `finally`; the shell also stops publisher
tracks/connections, clears the React Query cache, and navigates to `/login`.
Closing the tab clears session storage by browser semantics.

The web sidebar uses the authenticated account-home routes for its **Caring
for** control. Switching or creating a care space stores the returned token,
`home_id`, and `user_id`, clears the independent care-recipient selection and
any medication user-subject override, invalidates
React Query's home-scoped data, and opens the dashboard for the new care space.
The nearby care-recipient selector stores `one_care_recipient_id` and changes
care-profile context inside the active care space; it never changes
authorization. Existing medication flows keep their separate
`one_subject_user_id` because those backend contracts still reference user
subjects.

### Route-guard and onboarding audit

The current `App.tsx` guards every dashboard route except `/login`, `/create-account`,
and `/join*` when
`VITE_DEMO_MODE=false`. A missing token renders the login screen; a token is
held at a loading boundary while `/me` validates it; a `401` clears the token
and returns to login. A valid session without the scoped onboarding marker is
redirected to `/onboarding` before dashboard access. The marker is keyed by
`home_id` and `user_id` in local storage, so completing onboarding for one
account/home does not silently complete it for another. Onboarding records
purpose choices for daily check-in support (`audio_capture`), room/camera data
(`video_capture`), medication organization (`medication_management`), and
family sharing (`family_mode`); these choices are UX state and must still be
persisted through purpose-specific consent API calls before protected
processing. Camera permission is requested only from the explicit publisher
surface after consent.

## iOS login and storage audit

`HTTPOneAPIClient` uses the same `/api/v1` paths and sends a bearer header only when initialized with `accessToken` and `homeID`. `RuntimeConfiguration` treats any configured `ONE_API_BASE_URL`, including the default `http://127.0.0.1:8000/api/v1`, as live; demo data is available only when the URL is omitted in previews/tests.

`KeychainSessionStore` uses `kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly`.
`AppStore.configured()` restores a non-expired `AuthSession`, initializes the
authenticated HTTP adapter, and otherwise starts signed out. The login view
exchanges a code at `/pairing/complete`; the adapter accepts the backend's
optional `role` and verifies it through authenticated `/me` when necessary.
Sign out calls `/sessions/current` and clears the Keychain/session state even
when the network is unavailable. The current implementation is deliberately
pairing-code based; password, refresh-token, and identity-provider flows remain
out of scope.

## Logout, expiry, and revocation

`DELETE /api/v1/sessions/current` requires the current bearer token, deletes its hash from `sessions`, audits `session.logout`, and returns `{ "ok": true }`. Revocation is token-specific: there is no logout-all, refresh, or introspection endpoint. Care-space activation issues another one-home session after a membership check; it does not rotate or revoke previous tokens.

On `401` or logout, clients should stop SSE/realtime work, stop publisher tracks, clear token/home/user identifiers, invalidate cached home data, and return to pairing. LiveKit credentials are separate short-lived (600-second) tokens; ONE session deletion does not disconnect an already joined room, so clients must leave/close media explicitly.

## LiveKit and Tailscale assumptions

`POST /api/v1/homes/{home_id}/livekit/token` requires a ONE bearer. Publishers receive publish capability only and require active `video_capture` consent; caregiver/admin members receive subscribe capability. Missing credentials returns `503`; capability mismatches return `403`. The response contains the configured WebSocket URL, signed token, ten-minute expiry, and resolved mode.

Compose runs self-hosted development LiveKit with placeholder `devkey`/`secret`, not LiveKit Cloud. Webhook verification is enabled only when credentials are configured; non-production without credentials reports `verified: false`. A token endpoint or webhook response is not proof of a deployed subscriber/viewer path.

For a phone, `localhost`/`127.0.0.1` means the phone itself. An HTTPS page needs a trusted `wss://` LiveKit endpoint; plain `ws://localhost` will hit reachability/mixed-content/certificate constraints. Tailscale Serve can expose the frontend over a private tailnet, but it does not replace bearer auth, consent, role checks, or LiveKit reachability. Keep `/api/v1` in the iOS URL and keep LM Studio private.

## OpenAI-compatible providers and privacy boundary

The backend speaks the OpenAI-compatible `/chat/completions` shape. LM Studio is
the default local provider (`qwen3.6-35b-a3b`); OpenRouter or another compatible
gateway is an explicit override, never an implicit fallback:

```dotenv
ONE_LLM_ENABLED=true
ONE_LLM_PROVIDER=openrouter
ONE_LLM_BASE_URL=https://openrouter.ai/api/v1
ONE_LLM_MODEL=provider/model-name
ONE_LLM_API_KEY=replace-with-a-local-secret
ONE_LLM_TIMEOUT_SECONDS=15
```

Use `ONE_LLM_ENABLED=false` (the current local default) to make no model request
and use the deterministic non-medical fallback. A provider key is sent only as
a bearer header, is never logged or returned, and must stay in an ignored local
`.env`. Do not enable a hosted provider for household data until the controller
has approved the DPIA, processor/international-transfer review, purpose-specific
consent, retention, and deletion path. OpenRouter's free-tier budget is not a
dependency or a guarantee; an unavailable, rate-limited, or offline provider
must degrade explicitly and core object memory remains local.

Authentication does not establish legal representation or lawful basis for care. Current controls include purpose-versioned consent, video pause/revocation, same-home subject checks, publisher restrictions, audit rows, in-memory frame processing, 30-day observation expiry, and seven-day clip design. Export/deletion routes create requests; operational fulfilment, identity verification, backups, and legal timelines remain deployment work. Do not put real resident data, faces, audio, credentials, or prompts in these docs.

## Known limitations and readiness checklist

- Pairing-code exchange is the only login/bootstrap mechanism; add rate limits,
  attempt monitoring, and a reviewed recovery/rotation flow before real users.
- There is no refresh-token, logout-all, identity-provider, or password flow;
  clients must re-pair after expiry.
- Replace development secrets and use trusted TLS for API, frontend, and LiveKit.
- Decide on reviewed token storage/rotation per client threat model; there is no refresh endpoint today.
- Test expiry, logout, revoked membership, wrong-home access, consent revocation, and LiveKit disconnects with a disposable home.
- Keep demo fallback visibly separate from an unauthenticated or unavailable backend.
