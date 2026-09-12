# Architecture overview

ONE is a local-first, modular-monolith MVP. The backend is the policy and evidence boundary; clients are role-specific presentation and capture surfaces. Family mode adds bounded household coordination: multiple member accounts can have caregiver roles, while plans/check-ins remain purpose-gated and explicitly non-medical.

```text
┌──────────────────────────────┐
│ Browser dashboard / publisher │  React + Vite, demo/live API client
└──────────────┬───────────────┘
               │ HTTPS / bearer / SSE / LiveKit token
┌──────────────▼───────────────┐
│ FastAPI /api/v1               │  auth · consent · family · medication · retention
│ PostgreSQL + local object store│ vision · check-ins · OpenAI-compatible adapter
└──────┬──────────┬─────────────┘
       │          │
  RoomPlan    LM Studio / OpenRouter / compatible gateway
  / iOS       (optional; local LM Studio is the default)
```

## Request boundaries

- Every product route is under `/api/v1`.
- Pairing creates a home, user, membership, runtime state, and one-time code; completion creates a hashed-token session.
- Protected handlers verify the bearer token, session expiry, membership, and home ownership.
- Video capture endpoints additionally require active `video_capture` consent and reject the paused state.
- Vision frames are decoded and processed in memory; the current response explicitly says `persisted: false`.
- Observations become approximate events with evidence IDs and expiry. Clips are separately bounded and encrypted when a key is configured.

## Data flow

```text
camera frame → bounded base64 decode → detector → temporal stability → projection
                                                        ↓
                                      approximate observation + confidence + zone
                                                        ↓
                                  event bus / SSE → caregiver UI → human review
```

The LLM adapter is downstream of collected context. It returns a structured
summary when the configured OpenAI-compatible provider responds and a
deterministic non-medical fallback when it does not. LM Studio is the default;
hosted providers require an explicit environment override and privacy review.
The adapter is never the authorization or safety boundary.

## Family-mode boundary

Family mode is not a continuous household camera feed. With `family_mode` consent, an admin or caregiver can list household members and issue a single-use invite for another resident or caregiver. With `medication_management` consent, caregivers can organize human-entered plans, deterministic reminder slots, and check-in states (`pending`, `taken`, `skipped`, `missed`). The family assistant receives only the selected subject’s active plans and bounded check-in rows; it does not receive camera frames, transcripts, events, or the full household stream.

The web/iOS family surfaces currently demonstrate this flow with synthetic rows. The backend routes persist through the selected database, but client fixture data and real-person governance are not implied.
