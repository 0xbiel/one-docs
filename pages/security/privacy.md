# Privacy by design

ONE’s privacy posture is implemented as gates and data lifetimes, not just copy in the UI.

## Controls in the current code

- Purpose-level consent rows record policy version, grant time, and revocation time.
- Pausing a home makes `video_capture` inactive and blocks vision/LiveKit paths.
- Vision frame bytes are bounded, decoded, processed in memory, and not persisted.
- Identity and medical-inference labels are rejected at the frame boundary.
- Observations are approximate and explicitly marked as non-diagnostic.
- Event records expire after 30 days; clip records are designed for seven days.
- Clip bytes can be sealed with AES-GCM using a locally supplied key.
- Audit rows record consent, pairing, and privacy actions.
- Export and deletion requests are exposed through backend routes and web/iOS controls.
- iOS includes `PrivacyInfo.xcprivacy` and a manual fallback when RoomPlan is unavailable.
- Family sharing requires an explicit `family_mode` purpose and member/subject checks.
- Medication plans, reminders, and check-ins require `medication_management` consent; family-assistant context is limited to those records.

## GDPR-shaped controls

The web and iOS surfaces expose consent toggles, pause, export, and deletion request actions. These are product primitives, not a claim of legal compliance in every jurisdiction. Define a controller/processor role, retention policy, access procedure, and incident process before real-person deployment.

Do not put real resident names, email addresses, tokens, images, audio, or model prompts in this documentation or demo repository.

The current family records and iOS/web care-circle rows are synthetic demo data. Before real use, define the controller/processor role, lawful basis, representation/authority process, notices, retention, and rights workflows in the backend privacy documentation.
