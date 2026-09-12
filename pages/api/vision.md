# Vision & summaries (overview)

For exact operation IDs and schema constraints, see [Objects, vision & events](/api/observations) and [Check-ins & summaries](/api/checkins).

## Frame contract

`POST /api/v1/homes/{home_id}/vision/frames` accepts a camera ID, base64 frame bytes (maximum 3 MB after decode), width/height, one to 20 candidate labels, optional capture timestamp, and optional positive depth in meters. Labels for face, person identity, emotion, and medical symptom are rejected.

The response includes detections, a detector version, `persisted: false`, and a privacy note that frame bytes were processed in memory and not stored.

## Detection contract

Each detection carries a candidate label, confidence, bounding box, and projection. Temporal tracking stabilizes repeated hits. The default model version is `demo-deterministic-v1`; the OWLv2-compatible adapter reports `owlv2-unconfigured` until an inference function is injected.

## Summary contract

Check-in and caregiver-summary routes collect contextual evidence and call the LM Studio adapter when available. The configured model defaults to `qwen3.6-35b-a3b`. The adapter asks for structured JSON and validates the response; connection, parse, or model errors produce an explicit deterministic non-medical fallback. Model output is explanation support, never an authorization decision or diagnosis.

## Family assistant scope

`POST /api/v1/homes/{home_id}/family-assistant` is intentionally narrower than the check-in assistant. It sends only the selected subject’s active medication plans and up to 100 bounded check-in rows to the local model adapter. It excludes camera frames, transcripts, events, and a full household stream. The response reports whether it degraded to the deterministic `rules-family-v1` summary and always carries `medical_advice: false`.
