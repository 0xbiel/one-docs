# Quickstart

This path runs the current local MVP. Start with Docker: it provides the same-origin frontend/API path, PostgreSQL persistence, and the composed local dependencies. Manual Python/Vite startup is a fallback for development only.

## 1. Start Docker (recommended)

From the repository root:

```bash
cd one
test -f .env || cp .env.example .env
docker compose up --build -d api frontend
```

Compose defaults the API to `postgresql://one:change-me@postgres:5432/one` and applies the tracked migrations before serving requests. If an existing `.env` still contains the old `ONE_DATABASE_URL=sqlite:///...` line, change it to the PostgreSQL URL (or remove the line so Compose can use its default); do not overwrite an existing `.env` blindly. Open `http://127.0.0.1:4173`. The frontend proxies `/api/*` to FastAPI. Verify both the site and the selected database with `curl http://127.0.0.1:4173/api/v1/health`; a healthy Docker run reports `"database":"postgresql"`. The API is internal port `8000`; LiveKit uses `7880`, `7881`, and `7882/udp`. Keep port `4175` untouched; it is a separate existing Docker frontend. If `4173` is occupied, use alternate frontend port `4174`.

If the separate existing frontend is already running on `4175`, leave that
container untouched and start only the API with `docker compose up --build -d
api`; use `http://127.0.0.1:4175` for the website. The `api frontend` command
above is for a fresh stack whose frontend should use the default `4173` port.

## 2. Create an account and sign in

ONE's current account creation is pairing bootstrap, not password registration:

1. Open `/create-account` (also linked from the live `/login` screen) to create the caregiver household account. The form calls `POST /api/v1/pairing/start`, completes the returned code, and routes to `/onboarding`.
2. Onboarding asks for four purpose choices: daily check-in support (`audio_capture`), room/camera data (`video_capture`), medication organization (`medication_management`), and family sharing (`family_mode`). Complete every choice before dashboard access; the browser stores a marker scoped to `home_id` + `user_id`.
3. Returning caregivers use `/login` and enter a pairing/session code. The browser exchanges it at `/api/v1/pairing/complete`. People joining an existing home use the `/join-household` link and invitation code.
4. The live web client stores bearer token, home ID, and user ID in `sessionStorage`, then uses the token for API/SSE requests. The onboarding marker is only a device-local UX gate; it is not proof of consent, legal representation, or controller approval.

There is no password login, refresh-token, email verification, or external identity provider. Codes expire after ten minutes and are single-use. Logout is `DELETE /api/v1/sessions/current`, followed by clearing session storage and stopping active streams.

## 3. Household invite and onboarding

An admin/caregiver with `family_mode` consent creates an invite at `POST /api/v1/homes/{home_id}/family/invites`; the recipient accepts at `POST /api/v1/family/invites/accept`. Confirm home/role with `/api/v1/me`, record only understood purposes (`audio_capture`, `video_capture`, `family_mode`, and `medication_management` where applicable), pair a publisher through `/join/:code`, grant camera/microphone permission after consent, and calibrate RoomPlan or use manual zones.

Caregivers can support multiple people and, once memberships exist, multiple homes; each request is scoped to the token's `home_id` and selected subject. Cross-subject reads require caregiver/admin role and purpose consent. Web privacy/account controls are under `/dashboard/privacy`; iOS groups account/session and privacy controls under Account/Settings. Some family/medication rows remain synthetic; an invite code is not proof of legal representation.

## 4. iOS simulator and Tailscale

The iOS simulator uses `http://127.0.0.1:8000/api/v1` as deterministic demo mode and cannot provide RoomPlan/LiDAR. A physical iPhone needs `ONE_API_BASE_URL` set to a host-reachable HTTPS URL ending in `/api/v1`; `localhost` on the phone means the phone.

For private remote testing, run `tailscale serve --bg http://127.0.0.1:4175`
when using the existing checkout (or substitute `4173` for a fresh stack), then
run `tailscale serve --bg --https=8444 http://127.0.0.1:7880` and inspect
`tailscale serve status`. Use the reported website HTTPS URL for iOS/browser and
the LiveKit HTTPS port as `ONE_LIVEKIT_URL=wss://<tailnet-host>:8444` in the
backend `.env`, followed by an API restart. The self-hosted LiveKit service in
Compose is local and does not require a subscription; Tailscale only provides
private reachability and does not replace LiveKit authorization.

## Fallback: manual backend and Vite

```bash
cd one
python -m venv .venv && source .venv/bin/activate
pip install -e '.[dev]'
ONE_DATABASE_URL=sqlite:///./one.db uvicorn app.main:app --reload --port 8000
```

The manual fallback intentionally uses SQLite for zero-setup tests. Install `.[postgres]`, start a reachable PostgreSQL instance, and set a `postgresql://...` URL when you want to exercise the production-shaped adapter outside Docker.

In a second terminal: `cd one-frontend && npm ci && npm run dev`. Vite normally uses `5173`; use `4174` only for the alternate workflow. Do not use or rebind `4175`. Set `VITE_DEMO_MODE=false` and `VITE_API_BASE_URL=http://localhost:8000/api/v1` for live calls.

## Pair a publisher

An authenticated admin/caregiver starts `/api/v1/homes/{home_id}/pairing/start`; complete its code once at `/api/v1/pairing/complete`. Publisher accounts can publish media but cannot manage home metadata or family settings.

## What “working” means here

Health `ok`, a loaded dashboard, and navigable routes prove a local demo only—not camera hardware, LiveKit subscriber connectivity, external model availability, or production database readiness.
