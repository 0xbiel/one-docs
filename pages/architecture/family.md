# Family mode

Family mode is the household coordination layer: a home can have multiple member accounts, and some of those members can be caregivers. It is separate from the resident’s continuous camera view and is deliberately bounded to people, reminders, check-ins, and an evidence-scoped organizer assistant.

## Roles and access

| Role | Current backend meaning | Client presentation |
| --- | --- | --- |
| `admin` | Home administration, privacy controls, family management | Owner/admin caregiver |
| `caregiver` | Caregiver views and same-home care organization | Primary caregiver or supporter |
| `resident` | Own subject data and self-directed actions | Resident surface |
| `publisher` | Paired camera publisher; excluded from family member lists | Browser/iPhone publisher |

An admin or caregiver must record `family_mode` consent before listing household members or issuing an invite. A new invite is single-use, hashed, expires, and creates a synthetic demo account/session on acceptance. The route does not establish legal representation.

## Medication plans and check-ins

With `medication_management` consent, a caregiver can organize a subject’s human-entered plan: name, dose, schedule rule, instructions, active flag, optimistic version, and an optional `assigned_caregiver_id` that must point to a caregiver in the same home. Legacy daily times, weekday/weekend recurrence, and date-specific exceptions are filtered by the requested reminder day. Check-ins are administrative states (`pending`, `taken`, `skipped`, `missed`) with `created_by`/`marked_by` context.

The API exposes:

```text
GET   /api/v1/homes/{home_id}/medication-plans
POST  /api/v1/homes/{home_id}/medication-plans
PATCH /api/v1/homes/{home_id}/medication-plans/{plan_id}
GET   /api/v1/homes/{home_id}/medication-check-ins
POST  /api/v1/homes/{home_id}/medication-plans/{plan_id}/check-ins
GET   /api/v1/homes/{home_id}/medication-reminders
POST  /api/v1/homes/{home_id}/family-assistant
```

The assistant receives only active plans and bounded check-in rows for the selected subject. It does not receive frames, transcripts, events, or a full household stream, and responses carry `medical_advice: false`.

## Client status

The web `/dashboard/family` and iOS care-circle surfaces use the live family and
medication endpoints when authenticated. Each can select a different household
subject, display date-specific reminder slots, invite another caregiver, edit a
plan, acknowledge a check-in, and archive a plan without deleting its history.
Synthetic rows remain available only in explicit demo mode. Invitation delivery,
representation evidence, notifications, audit/rights workflow, and real-subject
governance still require a production adapter and approved DPIA.
