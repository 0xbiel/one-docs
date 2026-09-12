# Object memory & calibration

ONE remembers where an object was last observed as an approximate, reviewable fact.

## Vision pipeline

The current `CameraVisionPipeline` receives a bounded `Frame`, candidate labels, and optional depth. The default `DeterministicDemoDetector` produces stable no-download detections for demos and tests. `OWLv2Detector` is an injected adapter contract; it does not download a model or claim that live OWLv2 inference is configured.

Temporal stability requires repeated hits in a short window (three hits by default, two seconds, with IoU matching). This prevents a single noisy frame from immediately becoming a meaningful event.

## Projection behavior

With valid calibration and depth, the detector center is projected through camera intrinsics and a camera-to-world matrix. The result carries an uncertainty estimate that combines calibration error, depth uncertainty, and pixel error.

Without valid calibration or depth, ONE returns a named quadrant-like zone and a wider uncertainty radius with `zone-fallback`. This is intentionally less specific than a fabricated coordinate.

## Calibration records

The API accepts camera intrinsics, extrinsics, map ID, and optional accuracy in meters. The frontend’s calibration screen presents three anchors and an estimated error as a product flow; the backend record is the authoritative persisted contract. Treat all displayed accuracy as approximate until it is measured on the target camera and room.
