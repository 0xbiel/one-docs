# Family members, invites & assistant

Family mode models one household with multiple accounts. Members can be residents or caregivers; caregivers can organize plans and check-ins for a subject after purpose-specific consent. A caregiver role is not proof of legal representation.

## `GET /api/v1/homes/{home_id}/family/members`

Operation ID: `family_members_api_v1_homes__home_id__family_members_get`. Bearer home member; publishers blocked. A resident sees only themselves. Caregiver/admin views require `family_mode` consent and return non-publisher members. The response is `{ data, purpose: "family_mode", representation_required: true }`; demo rows are marked synthetic.

## `POST /api/v1/homes/{home_id}/family/invites`

Operation ID: `family_invite_api_v1_homes__home_id__family_invites_post`. Bearer caregiver/admin with `family_mode` consent. Request (`FamilyInviteIn`) requires `display_name` (1–120), accepts an optional normalized `email` (max 254), `role` (`resident` or `caregiver`, default `caregiver`), and `expires_in_seconds` 300–604800 (default 86400). When an email is supplied, it is the identity boundary for the invitation. The one-time code is returned once for the local development outbox; only its hash is persisted.

## `POST /api/v1/family/invites/accept`

Operation ID: `family_invite_accept_api_v1_family_invites_accept_post`. Public code exchange. Request (`FamilyInviteAcceptIn`) requires exactly six digits and accepts `email` plus optional `display_name`. For an email-bound invitation, the email is required, case-insensitively matched, and must already belong to an ONE account; otherwise acceptance fails without creating a membership. The existing account is attached to the invited home and receives a session, so changing phones does not lose household access. Legacy invites without an email retain the local compatibility path. Invalid/expired/used invitations return `400`; missing account returns `404`, mismatch returns `403`.

## `POST /api/v1/homes/{home_id}/family-assistant`

Operation ID: `family_assistant_api_v1_homes__home_id__family_assistant_post`.
Bearer caregiver/admin with family subject policy. Request
(`FamilyAssistantIn`) accepts `message` (max 1000, default empty) and either
`subject_user_id` or `care_recipient_id`.

The context is deliberately limited to the selected subject’s active
medication plans, medication acknowledgements, recent daily check-in
summaries, event counts, and bounded fall-safety analytics. It excludes raw
frames, face templates, encrypted event snapshot bytes, unbounded transcripts,
and the full household stream. The response carries
`context_scope="medication plans, medication check-ins, daily check-ins, and
bounded fall-safety analytics"`, filtered evidence IDs/timestamps, and
`medical_advice: false`.

The response includes `data`, `degraded`, `inference_status`, the selected
subject/care-recipient identifiers, `context_scope`, `medical_advice: false`,
and `model_version`. Evidence IDs are filtered to the bounded context. If the
local model is unavailable, the deterministic response remains an
administrative review summary rather than a diagnosis or emergency decision.

## `PATCH /api/v1/homes/{home_id}/family/members/{user_id}`

Operation ID: `family_member_update_api_v1_homes__home_id__family_members__user_id__patch`. Bearer caregiver/admin with `family_mode` consent. Request (`FamilyMemberUpdateIn`) accepts only `role: "resident"` or `role: "caregiver"`; it never grants `admin` access. A member cannot change their own role, an admin cannot be changed through this endpoint, and a non-admin caregiver cannot promote another member to caregiver. Existing sessions for the target are invalidated and the response returns `{ data, invalidated_sessions }`.

## `DELETE /api/v1/homes/{home_id}/family/members/{user_id}`

Operation ID: `family_member_remove_api_v1_homes__home_id__family_members__user_id__delete`. Bearer caregiver/admin with `family_mode` consent. Self-removal and admin removal are blocked. The member relationship, target sessions, and subject consents are removed transactionally, an audit entry is written, and the response returns the removed member view plus `invalidated_sessions`. Clients ask for confirmation because this endpoint is destructive and has no undo operation.

## Family UX versus deployment reality

The web and iOS family surfaces make multiple accounts, caregiver roles, medication plans, reminders, and check-ins visible. Their current demo data is mock/synthetic in places; invitation delivery, durable identity, representation evidence, notifications, and production rights workflows still need a real deployment adapter. The web uses a labelled “Swipe to reveal” affordance for desktop pointer/keyboard users and an explicit confirmation step; native iOS uses `swipeActions` with the same confirmation policy.
