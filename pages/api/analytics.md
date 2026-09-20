# Daily check-ins, fall analytics & assistant context

ONE keeps the daily check-in and camera safety signals as separate, reviewable
records. The analytics endpoint aggregates those records for a bounded window;
it does not accept frames, face templates, snapshot bytes, or an unlimited
household stream.

## `GET /api/v1/homes/{home_id}/analytics`

Operation ID: `home_analytics_api_v1_homes__home_id__analytics_get`. Bearer
home member; publishers are blocked. The optional `window_days` query is
clamped to 7–90 days and defaults to 30. An optional `care_recipient_id`
selects a care profile after the same family/recipient consent checks used by
other care-context routes.

The response is `{ data: ... }` and includes:

| Field | Meaning |
| --- | --- |
| `fall` | Count of `fall_suspected` signals, `needs_review`/reviewed counts, trend, daily buckets, and the ten most recent review records |
| `daily_check_in` | Total summaries, whether one was completed today, status counts, trend, daily buckets, and the ten most recent summaries |
| `event_counts` | Bounded event-type counts for the same window and selected care profile |
| `assistant_context` | Explicit allow-list and deny-list for downstream assistant context |
| `limitations` | Coverage, consent, retention, and non-diagnostic boundaries |

Trends are intentionally coarse (`increasing`, `decreasing`, `stable`, or
`unknown`). They are not a clinical baseline or a risk score. Counts depend on
camera coverage, lighting, framing, consent, and the selected retention
window.

## `POST /api/v1/homes/{home_id}/check-ins`

Operation ID: `check_in_api_v1_homes__home_id__check_ins_post`. The request
accepts a bounded `transcript` (maximum 4,000 characters) and either
`subject_user_id` or `care_recipient_id`, never both. A self check-in may use
the authenticated subject implicitly. Cross-person and care-recipient flows
require the relevant family/analytics consent.

The handler stores a 30-day `summaries` record and creates a matching
`daily_check_in` event so the result appears in Events and SSE. The response
contains the summary `id`, `event_id`, status, trend, explanation,
`evidence_ids`, limitations, `degraded`, `inference_status`, and
`model_version`. A degraded response is a deterministic fallback, not an
emergency or medical result.

The web and iOS caregiver surfaces present this as a short Start → prompt →
Back/Continue → Record flow. Only the bounded answer summary is retained by
this flow; raw audio is not stored.

## Assistant context boundary

`POST /api/v1/homes/{home_id}/family-assistant` receives the selected
subject’s active medication plans, medication acknowledgements, recent daily
check-in summaries, and aggregate fall-safety analytics. Its context scope is
reported as:

```text
medication plans, medication check-ins, daily check-ins, and bounded fall-safety analytics
```

The request context excludes:

- raw camera frames;
- face templates and biometric embeddings;
- encrypted event snapshot bytes;
- unbounded transcripts or a continuous household stream.

The response always carries `medical_advice: false`. If the local model is
unavailable, the backend returns a clearly labelled administrative summary
with human review as the next action.
