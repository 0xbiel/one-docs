# Check-ins & summaries

The check-in assistant is a bounded explanation surface. It uses recent derived events and a personal-baseline prompt, not a diagnosis engine. LM Studio is optional; deterministic fallback is explicit in the response.

## `POST /api/v1/homes/{home_id}/check-ins`

Operation ID: `check_in_api_v1_homes__home_id__check_ins_post`. Bearer home member; publishers blocked. Request (`CheckInIn`) accepts optional `subject_user_id` and `transcript` (default empty, max 4,000 chars). The handler uses up to 20 non-expired recent events, calls the local LM Studio adapter when available, stores a 30-day summary, and returns the summary ID plus `status`, `trend`, `explanation`, `evidence_ids`, `limitations`, `degraded`, `inference_status`, and `model_version`.

`degraded: true` means the deterministic fallback was used. It does not mean an emergency or clinical result.

## `GET /api/v1/homes/{home_id}/caregiver-summary`

Operation ID: `caregiver_summary_api_v1_homes__home_id__caregiver_summary_get`. Bearer caregiver/admin only; publishers blocked. Returns `{ data: [...] }` containing recent persisted summaries. Residents receive `403 Caregiver permission required`.

## Evidence and model boundaries

The current summary adapter defaults to local LM Studio configuration (`qwen3.6-35b-a3b` in the repository settings) and validates structured output. When unavailable, the rules fallback says what evidence exists and asks a human to review it. Prompts and output must stay within the documented evidence scope; do not add raw frames, broad transcripts, or continuous streams to a summary request without changing the threat model and contract.
