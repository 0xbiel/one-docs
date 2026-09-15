# Medication plans, check-ins & reminders

Medication features are administrative organization tools. They do not prescribe, verify ingestion, infer adherence from video, or provide medical advice. A plan can belong either to a care-recipient profile or to the legacy same-home user subject. Access is gated by `medication_management` consent for that exact scope.

## `GET /api/v1/homes/{home_id}/medication-plans`

Operation ID: `medication_plans_api_v1_homes__home_id__medication_plans_get`. Bearer home member. `care_recipient_id` selects a person receiving care without requiring that person to have a ONE login. The legacy `subject_user_id` path remains available for same-home user subjects; the two selectors cannot be supplied together. `active_only` defaults to `true`. Care-recipient reads require caregiver/admin family permission and active recipient-scoped `medication_management` consent. Returns `{ data, subject_user_id, care_recipient_id, purpose: "medication_management", medical_advice: false }`.

## `POST /api/v1/homes/{home_id}/medication-plans`

Operation ID: `medication_plan_create_api_v1_homes__home_id__medication_plans_post`. Bearer caregiver/admin family actor. Request (`MedicationPlanIn`) requires exactly one medication target: `care_recipient_id` for a care profile, or legacy `subject_user_id` for a same-home user. It also requires `name` (1–160), `dose` (1–120), and `schedule` (1–500). Optional `instructions` (max 1000), `active` (default true), and `assigned_caregiver_id` select a same-home caregiver. The response is a plan read model with `care_recipient_id`, optimistic `version`, assignment ID, and `medical_advice: false`.

The committed OpenAPI artifact includes `assigned_caregiver_id`; regenerate it
with the backend script whenever the model changes and let CI enforce the diff
before publishing a client contract.

## `PATCH /api/v1/homes/{home_id}/medication-plans/{plan_id}`

Operation ID: `medication_plan_update_api_v1_homes__home_id__medication_plans__plan_id__patch`. Bearer caregiver/admin family actor. Request (`MedicationPlanUpdate`) accepts any subset of plan fields, optional `assigned_caregiver_id`, and optional `version` ≥1. Supplying the current version enables optimistic concurrency; a mismatch returns `409 Medication plan version conflict`. Updates increment the server version.

## `GET /api/v1/homes/{home_id}/medication-check-ins`

Operation ID: `medication_check_ins_api_v1_homes__home_id__medication_check_ins_get`. Optional `care_recipient_id` or legacy `subject_user_id` chooses the medication scope; they cannot be combined. `scheduled_from` and `scheduled_to` provide date-time filters. Care-recipient and cross-user reads require family permission. Returns `{ data, subject_user_id, care_recipient_id, medical_advice: false }`. Check-in rows expose `marked_by_name` when a person has recorded the status.

## `POST /api/v1/homes/{home_id}/medication-plans/{plan_id}/check-ins`

Operation ID: `medication_check_in_api_v1_homes__home_id__medication_plans__plan_id__check_ins_post`. The subject or an authorized caregiver/admin can upsert a scheduled row. Request (`MedicationCheckInIn`) requires `scheduled_for` date-time and `status` (`pending`, `taken`, `skipped`, or `missed`); optional `note` is max 500 chars. Response is `{ data, medical_advice: false }`.

## `GET /api/v1/homes/{home_id}/medication-reminders`

Operation ID: `medication_reminders_api_v1_homes__home_id__medication_reminders_get`. Optional `day` (`YYYY-MM-DD`, default current UTC day) plus either `care_recipient_id` or legacy `subject_user_id`. Reminders are deterministic slots parsed from explicit schedule text, with the care-recipient ID, status, assigned caregiver display fields, and check-in attribution. Response includes `{ data, subject_user_id, care_recipient_id, timezone: "UTC", deterministic: true, medical_advice: false }`.

Schedule examples: legacy `08:00,20:00` is daily; `Mon,Wed,Fri @ 08:00`
is limited to those weekdays; `weekdays 08:00` and `weekends 20:00` cover
weekday groups; and `2026-09-12 @ 08:00` is a date-specific exception. Multiple
rules may be separated by semicolons. Unsupported schedule text becomes an
explicit `unscheduled` slot for human review; it is never guessed into a dose
time.

## Client flow

The native iOS Family view selects a care recipient, chooses the reminder date,
and loads plans and generated slots with that care profile's ID. **Add plan**
keeps the person and assigned caregiver as separate identifiers, while the
backend verifies that both belong to the active care space. iOS canonicalizes
UUIDs in request bodies and the API also normalizes valid UUID text before
database comparison, so letter case cannot produce a false `Care recipient not
found` response. **Edit** sends a versioned `PATCH`; archive remains a reversible
disable (`active=false`) after confirmation, not a destructive delete. Each
pending slot can be marked through the check-in endpoint with the human marker
retained for attribution.
