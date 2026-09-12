# Family members, invites & assistant

Family mode models one household with multiple accounts. Members can be residents or caregivers; caregivers can organize plans and check-ins for a subject after purpose-specific consent. A caregiver role is not proof of legal representation.

## `GET /api/v1/homes/{home_id}/family/members`

Operation ID: `family_members_api_v1_homes__home_id__family_members_get`. Bearer home member; publishers blocked. A resident sees only themselves. Caregiver/admin views require `family_mode` consent and return non-publisher members. The response is `{ data, purpose: "family_mode", representation_required: true }`; demo rows are marked synthetic.

## `POST /api/v1/homes/{home_id}/family/invites`

Operation ID: `family_invite_api_v1_homes__home_id__family_invites_post`. Bearer caregiver/admin with `family_mode` consent. Request (`FamilyInviteIn`) requires `display_name` (1–120), optional `email` (max 254), `role` (`resident` or `caregiver`, default `caregiver`), and `expires_in_seconds` 300–604800 (default 86400). The one-time code is returned once for the synthetic local flow; only its hash is persisted.

## `POST /api/v1/family/invites/accept`

Operation ID: `family_invite_accept_api_v1_family_invites_accept_post`. Public code exchange. Request (`FamilyInviteAcceptIn`) requires exactly six digits and optional `display_name` (max 120). Acceptance creates a new account/membership/session and returns bearer credentials plus `role`. Invalid/expired/used invitations return `400`.

## `POST /api/v1/homes/{home_id}/family-assistant`

Operation ID: `family_assistant_api_v1_homes__home_id__family_assistant_post`. Bearer caregiver/admin with family subject policy. Request (`FamilyAssistantIn`) accepts `message` (max 1000, default empty) and optional `subject_user_id`. The context is deliberately limited to the subject’s active medication plans and up to 100 check-in rows; it excludes frames, events, transcripts, and the full household stream.

The response includes `data`, `degraded`, `inference_status`, `subject_user_id`, `context_scope`, `medical_advice: false`, and `model_version`. Evidence IDs are filtered to the bounded context.

## Family UX versus deployment reality

The web and iOS family surfaces make multiple accounts, caregiver roles, medication plans, reminders, and check-ins visible. Their current demo data is mock/synthetic in places; invitation delivery, durable identity, representation evidence, notifications, and production rights workflows still need a real deployment adapter.
