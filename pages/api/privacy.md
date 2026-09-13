# Consent & privacy operations

Consent is explicit, purpose-scoped, and tied to a subject. Use the exact purpose strings used by the running backend: `video_capture`, `audio_capture`, `family_mode`, and `medication_management` for the current onboarding flow (with `family_assistant` additionally required by the bounded assistant route). A caregiver role does not automatically establish legal representation.

## `GET /api/v1/homes/{home_id}/consents`

Operation ID: `consent_list_api_v1_homes__home_id__consents_get`. Bearer home member; publishers are blocked. Returns `{ data: [...] }` with recorded consent rows ordered newest first.

## `POST /api/v1/homes/{home_id}/consents`

Operation ID: `consent_api_v1_homes__home_id__consents_post`. Bearer home member;
publishers may record only their own `video_capture` or `audio_capture`
decision, while other consent purposes remain blocked. Request (`ConsentIn`)
requires `purpose` (1–120 chars) and `policy_version` (1–40 chars), with
`granted` defaulting to `true` and optional `subject_user_id`. Without a subject
ID, the actor is the subject. Represented-subject decisions require
admin/caregiver role and an actual consent/authority process outside this
endpoint.

The response contains `id`, `granted`, `subject_user_id`, and current `paused` state. Recording `video_capture` updates the home runtime pause flag.

## `POST /api/v1/homes/{home_id}/privacy/export`

Operation ID: `privacy_export_api_v1_homes__home_id__privacy_export_post`. Bearer home member; publishers are blocked. Returns `home_id`, `exported_at`, and the current database export for that home. Treat the response as personal data: do not paste it into logs, tickets, or model prompts.

## `POST /api/v1/homes/{home_id}/privacy/delete`

Operation ID: `privacy_delete_api_v1_homes__home_id__privacy_delete_post`. Bearer admin only. The handler removes map artifacts and encrypted clip material, cascades home-owned records in a transaction, and returns `{ request_id, status: "completed" }` when cleanup finishes. A media cleanup failure returns `503 Deletion is pending media cleanup` with `X-Deletion-Request-ID`; retry using an operator workflow rather than assuming deletion completed.

## Camera sweep privacy behavior

The guided camera sweep is an 8–12 second, consent-gated processing window.
Its RGB samples are temporary input to the local geometry worker. The desired
terminal behavior is:

| Outcome | Stored |
| --- | --- |
| ready | Derived relative polygons, walls, camera pose, confidence, model metadata, and map revision |
| needs_rescan | Previous map plus a bounded terminal status; no raw frames |
| unavailable | Previous map plus a bounded worker error/status; no raw frames |
| failed | Previous map plus a bounded validation/error status; no raw frames |

The current vision frame endpoint remains an in-memory object-detection route;
it is not a camera-map upload route. Do not infer room geometry retention or
map-generation success from a response with persisted set to false.

## Privacy boundaries

The vision frame route processes bytes in memory and reports `persisted: false`; this does not mean all other evidence (observations, events, summaries, or user-uploaded clips) is ephemeral. Retention and deletion are separate controls. See [privacy by design](/security/privacy) and [known limitations](/security/limitations).
