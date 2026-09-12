# Known limitations

This page is intentionally direct: it is the checklist that keeps a demo from becoming an overclaim.

- PostgreSQL is the authoritative Compose adapter with transactional numbered migrations and an opt-in CI contract suite. SQLite remains an explicit zero-setup/unit-test fallback; it is not the Docker deployment path.
- Redis, MinIO, and LiveKit are composed services; the backend’s complete local primitives are SQLite, local object storage, an in-process event bus, and signed helper code.
- The Docker frontend and same-origin `/api/v1` proxy are wired and runnable, but Tailscale Serve is an operator-managed network workflow, not bundled infrastructure.
- The default detector is deterministic and no-download. OWLv2 is an injected contract, not a configured downloaded model.
- Frame vision returns in-memory results; a complete camera-to-events production worker is not present.
- The web and iOS family surfaces use mock/synthetic household accounts, medication doses, and assistant actions; backend family contracts are bounded but client persistence is not complete.
- LiveKit token/publisher scaffolding and a viewer surface exist; a verified production LiveKit subscriber path is not complete.
- Browser camera success depends on secure origin, permissions, hardware, network, and a real LiveKit deployment.
- RoomPlan requires supported iPhone hardware; Simulator uses the manual-zone fallback.
- Calibration accuracy is approximate until measured and monitored on the target room/camera.
- The LLM adapter depends on a locally reachable LM Studio endpoint; fallback summaries are deterministic and non-medical.
- OWLv2 remains an injected/unconfigured adapter contract; no production model deployment is included.
- Redis and MinIO are still composed dependency slots: the MVP uses an in-process event bus and local encrypted object storage, so durable queue/object-store adapters remain deployment work.
- Export/deletion request endpoints are present, but operational fulfilment, identity verification, backups, and legal process need deployment policy.
- There is no claim of emergency detection, medical diagnosis, autonomous intervention, or population baseline comparison.
