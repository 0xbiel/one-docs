# Check-ins & summaries

The daily check-in is a bounded caregiver-led interaction. It records a short
human signal against the person’s own recent context; it is not a diagnosis
engine. LM Studio is optional and deterministic fallback is explicit in the
response. The related 7–90 day aggregates are documented in [Daily check-ins &
fall analytics](/api/analytics).

## `POST /api/v1/homes/{home_id}/check-ins`

Operation ID: `check_in_api_v1_homes__home_id__check_ins_post`. Bearer home
member; publishers blocked. Request (`CheckInIn`) accepts a bounded
`transcript` (maximum 4,000 characters) and either `subject_user_id` or
`care_recipient_id`; the two selectors cannot be combined. A self check-in may
omit the subject. Cross-person and care-recipient flows require the applicable
family/analytics consent.

The handler uses up to 20 non-expired recent derived events, calls the local
LM Studio adapter when available, stores a 30-day summary, and creates a
matching `daily_check_in` event. The response returns the summary `id`,
`event_id`, optional `care_recipient_id`, `status`, `trend`, `explanation`,
`evidence_ids`, `limitations`, `degraded`, `inference_status`, and
`model_version`.

`degraded: true` means the deterministic fallback was used. It does not mean an emergency or clinical result.

## `GET /api/v1/homes/{home_id}/caregiver-summary`

Operation ID: `caregiver_summary_api_v1_homes__home_id__caregiver_summary_get`. Bearer caregiver/admin only; publishers blocked. Returns `{ data: [...] }` containing recent persisted summaries. Residents receive `403 Caregiver permission required`.

## Evidence and model boundaries

The current summary adapter defaults to local LM Studio configuration
(`qwen3.6-35b-a3b` in the repository settings) and validates structured
output. When unavailable, the rules fallback says what evidence exists and
asks a human to review it. Prompts and output must stay within the documented
evidence scope. The daily check-in flow keeps only its bounded answer summary;
it does not store raw audio.

The matching event makes the result available through `GET /events` and the
home SSE stream. Client surfaces keep the check-in visually separate from
fall-safety signals so a normal check-in cannot be mistaken for a safety
alert.
