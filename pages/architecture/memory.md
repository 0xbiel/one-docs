# Object memory & calibration

ONE remembers where an object was last observed as an approximate, reviewable fact.

## Vision pipeline

The current `CameraVisionPipeline` receives a bounded `Frame`, candidate labels, and optional depth. The default `DeterministicDemoDetector` produces stable no-download detections for demos and tests. `OWLv2Detector` is an injected adapter contract; it does not download a model or claim that live OWLv2 inference is configured.

Temporal stability requires repeated hits in a short window (three hits by default, two seconds, with IoU matching). This prevents a single noisy frame from immediately becoming a meaningful event.

## Projection behavior

With valid calibration and depth, the detector center is projected through camera intrinsics and a camera-to-world matrix. The result carries an uncertainty estimate that combines calibration error, depth uncertainty, and pixel error.

Without valid calibration or depth, ONE returns a named quadrant-like zone and a wider uncertainty radius with `zone-fallback`. This is intentionally less specific than a fabricated coordinate.

## Camera pose and calibration records

The automatic camera-map result carries a relative camera pose, image-space
transform, homography or reprojection error where available, and confidence.
RGB-only mapping has no reliable metric scale, so it must not display a
fabricated accuracy in meters.

The API's existing calibration record accepts camera intrinsics, extrinsics,
map ID, and optional accuracy for compatibility with older clients. The old
three-anchor frontend flow and hardcoded meter value are legacy data and should
be marked rescan-required. They are not the source of camera-derived geometry.

When a real native RoomPlan map is available, its metric coordinate frame comes
from the LiDAR scan, not from the browser camera calibration. See
[Camera mapping](/architecture/camera-mapping) for the provenance gate.
