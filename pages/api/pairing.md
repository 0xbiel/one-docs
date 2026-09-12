# Authentication & pairing (overview)

This page is the short narrative version. For operation IDs, exact request constraints, and all auth gates, use [Auth, pairing & sessions](/api/auth-sessions). Every route is under `/api/v1`.

## Pairing start

`POST /api/v1/pairing/start` accepts a display name, optional email, home name, and role (`admin`, `resident`, or `caregiver`). In production it requires `X-Bootstrap-Secret`; development accepts no header or the configured local secret. It creates the home membership and returns a six-digit code that expires after 600 seconds. An authenticated admin/caregiver can use `POST /api/v1/homes/{home_id}/pairing/start` to create a same-home publisher device.

## Pairing complete

`POST /api/v1/pairing/complete` accepts exactly six digits. The backend hashes the submitted code, rejects expired or already-used rows, marks it used, creates a session, and returns a bearer token. Store that token in a protected client session and send it as:

```http
Authorization: Bearer <access_token>
```

The backend stores the token hash, checks its expiry, joins the membership, and checks the requested home on protected routes. Logout deletes the current session row.

## Bootstrap secret versus user token

The bootstrap secret initializes a pairing flow; it is not a user session and should never be embedded in the browser bundle. The bearer token authorizes a paired member and should be treated as sensitive. Never log either value.

## Household invitations

Family mode uses `POST /api/v1/homes/{home_id}/family/invites` and `POST /api/v1/family/invites/accept`. After `family_mode` consent, an admin or caregiver can invite another resident or caregiver. The code is single-use and stored hashed; acceptance creates a new synthetic demo account and session. This is not legal representation or a substitute for a consent/authority process.
