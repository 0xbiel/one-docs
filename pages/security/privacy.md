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
- iOS includes `PrivacyInfo.xcprivacy` and keeps RoomPlan-unavailable devices on
  an explicit non-3D/legacy state; they must not be presented as LiDAR maps.
- Family sharing requires an explicit `family_mode` purpose and member/subject checks.
- Medication plans, reminders, and check-ins require `medication_management` consent; family-assistant context is limited to those records.

## Camera-map retention

The guided sweep is an 8–12 second RGB processing window. Sample frames are
bounded, held only for the active generation job, and discarded after ready,
needs_rescan, unavailable, or failed. They must not be written to PostgreSQL,
the object store, application logs, browser storage, or the documentation
repository.

Only derived camera-map data is durable: relative polygons, wall segments,
camera pose, confidence, source resolution, job status, model version, and map
revision metadata. The camera-derived 2D record is explicitly relative and
does not contain a fabricated meter accuracy. Export and deletion requests
must include these derived records.

RoomPlan data has a different provenance boundary. A 3D map is retained only
after native iOS provenance, LiDAR capability, schema, coordinate frame, units,
up axis, and geometry have been validated. A browser RGB sample never creates a
3D artifact.

If the local M3 Pro worker is unavailable, no sample set is retained as a map.
The backend may retain a terminal job status and bounded error code for
support, but it must not retain the raw frames that caused it.

## GDPR-shaped controls

The web and iOS surfaces expose consent toggles, pause, export, and deletion request actions. These are product primitives, not a claim of legal compliance in every jurisdiction. Define a controller/processor role, retention policy, access procedure, and incident process before real-person deployment.

Do not put real resident names, email addresses, tokens, images, audio, or model prompts in this documentation or demo repository.

Synthetic family rows are confined to explicit demo mode. Live iOS/web care-circle views read backend memberships and enforce the API's consent and role checks. Before real use, define the controller/processor role, lawful basis, representation/authority process, notices, retention, and rights workflows in the backend privacy documentation.
