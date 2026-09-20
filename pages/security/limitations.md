# Known limitations

This page is intentionally direct: it is the checklist that keeps a demo from becoming an overclaim.

## Mapping boundary

- The intended camera-cv-2d result is an automatic relative map from a guided
  RGB sweep. It is not metric and must not display fake calibration accuracy.
- The provisional caller-supplied-zone and generic map routes remain only as
  compatibility seams and are stored as legacy-2d/rescan-required. They do not
  prove that a room-layout worker ran.
- The local M3 Pro PyTorch/MPS room-layout worker is a separate host process,
  not a Compose service. The backend has the persistent map-generation job
  route, and model mode requires the real YOLOv8-World v2 checkpoint, its
  configuration, Ultralytics/OpenCV dependencies, and a working accelerator.
  Until those are installed, live jobs correctly report unavailable instead of
  creating a synthetic map.
- The 3D view is reserved for a validated native RoomPlan artifact with
  LiDAR provenance. Safari, a browser camera, Simulator, and a non-LiDAR
  device cannot unlock it.
- Existing test@test fallback maps and manual three-anchor calibrations are
  legacy fixtures. They should be marked rescan-required, not presented as
  automatic geometry.

- PostgreSQL is the authoritative Compose adapter with transactional numbered migrations and an opt-in CI contract suite. SQLite remains an explicit zero-setup/unit-test fallback; it is not the Docker deployment path.
- Redis, MinIO, and LiveKit are composed services; the backend’s complete local primitives are SQLite, local object storage, an in-process event bus, and signed helper code.
- The Docker frontend and same-origin `/api/v1` proxy are wired and runnable, but Tailscale Serve is an operator-managed network workflow, not bundled infrastructure.
- The default detector is deterministic and no-download. OWLv2 is an injected contract, not a configured downloaded model.
- Frame vision returns in-memory results; a complete camera-to-events production worker is not present.
- The web and iOS family surfaces include live care-recipient, daily-check-in,
  event, and bounded assistant contracts; some broader family/medication
  presentation rows remain synthetic in explicit demo mode.
- Face recognition depends on the local face model and encrypted template
  configuration. It is an opted-in identity aid for enrolled care recipients,
  not general surveillance or an authentication factor.
- Fall detection is a temporal bounding-box heuristic that can miss events or
  produce false positives. It creates review prompts and one optional evidence
  image; it is not emergency detection, medical diagnosis, or autonomous
  intervention.
- LiveKit token/publisher scaffolding and a viewer surface exist; a verified production LiveKit subscriber path is not complete.
- Browser camera success depends on secure origin, permissions, hardware, network, and a real LiveKit deployment.
- RoomPlan requires supported iPhone or iPad hardware and native capture; Safari cannot capture it. Simulator and non-LiDAR devices use the 2D/legacy path, not a 3D model.
- Native RoomPlan export and scene upload are implemented, but acceptance still
  requires a physical LiDAR device: simulator tests can prove the capability
  gate and contract, not sensor capture, RoomBuilder output, or USDZ rendering.
  The structured RoomPlan JSON is canonical; USDZ is an optional 50 MiB
  attachment and a missing attachment leaves a retryable 3D asset state.
- Camera-derived RGB geometry has relative scale only. A camera pose or reprojection estimate is not a measured accuracy in meters.
- The LLM adapter depends on a locally reachable LM Studio endpoint; fallback summaries are deterministic and non-medical.
- Daily check-in and fall analytics are bounded metadata summaries. Trends are
  coarse and depend on camera coverage, lighting, consent, retention, and the
  selected window; they do not establish a clinical baseline.
- OWLv2 remains an injected/unconfigured adapter contract; no production model deployment is included.
- Redis and MinIO are still composed dependency slots: the MVP uses an in-process event bus and local encrypted object storage, so durable queue/object-store adapters remain deployment work.
- Export/deletion request endpoints are present, but operational fulfilment, identity verification, backups, and legal process need deployment policy.
- There is no claim of emergency detection, medical diagnosis, autonomous intervention, or population baseline comparison.
