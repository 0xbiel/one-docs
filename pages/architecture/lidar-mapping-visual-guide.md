# LiDAR & mapping visual guide

This page is the visual companion to [Camera mapping](/architecture/camera-mapping)
and [Spatial models, maps & detection](/api/spatial-vision). It shows how ONE
turns a native RoomPlan scan into a metric room model, positions a separate
fixed camera inside that model, and projects live detections back into the same
coordinate frame.

The key idea is simple: **the map, the camera pose, and a detected object are
three separate pieces of evidence**. ONE only combines them when their
provenance and map revision agree.

## 1. Which spatial path is being used?

The browser and native LiDAR paths solve different problems. A browser sweep
can give useful relative 2D context, while a physical RoomPlan scan is the
source of the metric 3D room.

```mermaid
flowchart TD
    start["Need spatial context for a room"] --> source{"What sensor source is available?"}

    source -->|"Browser / fixed RGB camera"| browser["Guided RGB room sweep"]
    browser --> worker["Local YOLO-World + OpenCV geometry worker"]
    worker --> map2d["camera-cv-2d<br/>relative 2D map"]
    map2d --> twoD["2D dashboard context<br/>no metric 3D claim"]

    source -->|"LiDAR-capable iPhone or iPad"| native["Native RoomPlan capture"]
    native --> sensors["LiDAR depth + RGB + ARKit pose"]
    sensors --> roomplan["RoomBuilder + ONE normalization"]
    roomplan --> gate{"Native provenance and<br/>3D geometry valid?"}
    gate -->|"No"| reject["Reject / needs rescan<br/>3D remains locked"]
    gate -->|"Yes"| map3d["roomplan-lidar-3d<br/>metric roomplan-local map"]
    map3d --> render["Top-down 2D + native 3D view"]
```

The browser path never gets promoted into RoomPlan. A convincing-looking 2D
polygon is still `camera-cv-2d`; only a validated native LiDAR payload can
create `roomplan-lidar-3d`.

## 2. How a LiDAR scan becomes the room model

RoomPlan is not just a mesh export. The native app keeps structured geometry
as the canonical source and can attach USDZ as a richer rendering artifact.

```mermaid
flowchart LR
    subgraph Device["LiDAR iPhone / iPad"]
        lidar["LiDAR depth"]
        rgb["RGB camera"]
        arkit["ARKit tracking"]
        capture["RoomCaptureSession"]
        builder["RoomBuilder"]
        normalize["ONE RoomPlan normalization"]

        lidar --> capture
        rgb --> capture
        arkit --> capture
        capture --> builder --> normalize
    end

    subgraph Payload["Authenticated native upload"]
        structured["Normalized walls, floors,<br/>doors, windows, objects,<br/>transforms and sections"]
        metadata["native-roomplan provenance<br/>LiDAR=true · metric · Y-up<br/>roomplan-local"]
        usdz["Optional USDZ attachment"]
    end

    subgraph Backend["ONE backend"]
        validate["Strict RoomPlan validation"]
        revision["New map revision"]
        scene["Scene contract"]
    end

    normalize --> structured --> validate
    normalize --> metadata --> validate
    normalize --> usdz
    validate --> revision --> scene
    usdz --> revision
```

The structured RoomPlan payload remains authoritative. USDZ is attached to the
same validated map revision for richer 3D rendering; it is not used to invent
provenance or unlock 3D by itself.

## 3. What is actually measured during the scan?

The scan combines several sensor facts. LiDAR contributes depth, ARKit
contributes camera motion and pose, and RGB contributes visual features that
can later help a different camera recognize where it is.

```mermaid
flowchart TD
    frame["One native scan sample"] --> pixel["RGB pixels"]
    frame --> depth["LiDAR depth per usable pixel"]
    frame --> intrinsics["Camera intrinsics<br/>fx · fy · cx · cy"]
    frame --> pose["ARKit camera_to_world<br/>4 × 4 transform"]

    pixel --> keypoint["ORB feature at pixel u,v"]
    depth --> backproject["Back-project pixel ray<br/>using measured depth"]
    intrinsics --> backproject
    keypoint --> backproject
    backproject --> cameraPoint["3D point in camera space"]
    pose --> worldPoint["Transform into roomplan-local"]
    cameraPoint --> worldPoint
    worldPoint --> landmark["Metric visual landmark<br/>descriptor + XYZ"]
```

Conceptually, the intrinsics turn a pixel into a camera ray, LiDAR supplies the
distance along that ray, and `camera_to_world` moves the resulting point into
the RoomPlan coordinate frame.

## 4. How a separate fixed camera is positioned in the LiDAR map

The Mac/browser camera did not participate in the RoomPlan ARKit session, so it
does not automatically know its world pose. ONE creates a visual bridge between
the scan and the fixed camera.

```mermaid
sequenceDiagram
    participant I as LiDAR iPhone
    participant A as ONE API
    participant G as Geometry worker
    participant C as Fixed camera
    participant S as Scene

    I->>A: Upload RoomPlan map revision
    I->>A: Upload bounded RGB + depth + ARKit samples
    A->>G: Build visual landmarks
    G-->>A: ORB descriptors + metric XYZ landmarks
    A-->>S: Store derived landmark artifact for map revision

    C->>A: Send current JPEG burst with review_only=true
    A->>G: Localize against active RoomPlan landmarks
    G->>G: ORB matching
    G->>G: 2D ↔ 3D correspondences
    G->>G: solvePnPRansac + quality checks

    alt Strong, unambiguous solution
        G-->>A: positioned + camera_to_world
        A-->>S: Store needs_review proposal
        A-->>C: review_required=true + proposed transform
    else Weak or ambiguous solution
        G-->>A: needs_rescan
        A-->>C: No proposal; retry or place manually
    end
```

PnP/RANSAC is the bridge: it finds the 6-DoF fixed-camera pose that best
explains where the matched 3D RoomPlan landmarks appear in the camera image.
Passing the localization gate creates a **proposal**, not an active placement.
The camera becomes active in the map only after a person reviews and saves that
transform.

## 5. Review before activation

Automatic localization is deliberately one step short of activation. The fixed
camera page loads the camera-scoped RoomPlan preview, draws the proposed camera
in amber, and gives the person three choices: confirm it, adjust it manually,
or discard it and retry.

```mermaid
flowchart TD
    ready["RoomPlan map + visual landmarks ready"] --> auto["One automatic localization proposal per map/session"]
    auto --> strong{"Strong pose found?"}
    strong -->|"No"| fallback["Stay usable without 3D placement<br/>retry or manual placement"]
    strong -->|"Yes"| pending["needs_review proposal<br/>existing active pose unchanged"]
    pending --> preview["Amber camera on top-down RoomPlan preview"]
    preview --> choice{"Does this match the real camera?"}
    choice -->|"Yes"| confirm["Confirm proposal"]
    choice -->|"Adjust"| manual["Click X/Z + tune yaw, tilt, height"]
    choice -->|"Retry"| discard["Discard proposal"]
    manual --> save["Save reviewed transform"]
    confirm --> save
    save --> active["Active camera registration"]
    discard --> ready
```

```mermaid
sequenceDiagram
    participant C as Fixed camera page
    participant A as ONE API
    participant P as RoomPlan preview

    C->>A: POST localize-roomplan (review_only=true)
    A-->>C: needs_review proposal + camera_to_world
    C->>A: GET camera-scoped placement preview
    A-->>C: active RoomPlan scene
    C->>A: GET camera-scoped preview USDZ
    A-->>C: native RoomPlan model
    C->>P: Render amber proposed camera
    alt proposal is correct
        C->>A: POST camera-registrations/roomplan
        A-->>C: positioned
    else manual adjustment
        C->>P: Click floor position + adjust pose
        C->>A: POST camera-registrations/roomplan
        A-->>C: positioned
    else retry
        C->>C: Discard proposal; keep prior active placement
    end
```

The general household `/scene` and normal map USDZ routes remain
caregiver/admin surfaces. A publisher can fetch the placement preview only for
its own camera, so review does not broaden camera-device permissions.

## 6. The coordinate-frame bridge

Once localization succeeds, the fixed camera and RoomPlan geometry share one
frame. This is what makes a camera frustum, furniture, and live detections line
up in the same map.

```mermaid
flowchart LR
    image["Fixed-camera image<br/>pixel u,v"] --> ray["Camera ray<br/>from intrinsics"]
    ray --> cameraSpace["Camera coordinate frame"]
    registration["camera_to_world<br/>from PnP/RANSAC"] --> transform["4 × 4 transform"]
    cameraSpace --> transform
    transform --> world["roomplan-local<br/>X,Y,Z"]

    room["RoomPlan walls / floor / objects"] --> world
    world --> floor["Top-down floor view"]
    world --> model["3D room view"]
    world --> zones["Room-zone lookup"]
```

Without a valid registration, ONE can still run local object detection, but it
cannot truthfully place the result at metric XYZ coordinates in the RoomPlan
scene.

## 7. From a live camera frame to a marker on the map

Detection and mapping are separate. A map can exist without live detections,
and YOLO can detect an object without knowing its RoomPlan position.

```mermaid
flowchart TD
    live["Live camera frame"] --> detect["Local YOLO-World detection"]
    detect --> tracker["Temporal stability tracker"]
    tracker --> stable{"Detection stable?"}
    stable -->|"No"| transient["Keep transient<br/>do not persist observation"]
    stable -->|"Yes"| registered{"Camera registered to<br/>active RoomPlan map?"}

    registered -->|"No"| fallback["Image-zone fallback<br/>no metric XYZ"]
    registered -->|"Yes"| depth{"Depth available for<br/>this observation?"}
    depth -->|"Yes"| backproject["Back-project with depth"]
    depth -->|"No"| floorRay["Cast bottom-centre ray<br/>to RoomPlan floor"]

    backproject --> transform["Apply camera_to_world"]
    floorRay --> transform
    transform --> point["Metric worldPoint<br/>+ active mapId"]
    point --> zone["Match RoomPlan room zone"]
    zone --> observation["Derived observation"]
    observation --> overlay["2D / 3D scene overlay"]
```

The frontend only draws a metric observation when its `mapId` matches the
active scene. That prevents an old point from appearing on a newly scanned
room revision.

## 8. Why a new LiDAR scan invalidates camera placement

A RoomPlan revision defines a coordinate frame. Even if the new scan describes
the same physical room, ONE cannot assume its origin and orientation are
identical to the previous revision.

```mermaid
stateDiagram-v2
    [*] --> MapV1: RoomPlan revision 1 accepted
    MapV1 --> CameraV1: Fixed camera localized
    CameraV1 --> ProjectingV1: Live detections use map v1

    ProjectingV1 --> MapV2: New RoomPlan scan accepted
    MapV2 --> NeedsRelocalization: Old registration belongs to map v1
    NeedsRelocalization --> CameraV2: PnP localization succeeds on v2 landmarks
    NeedsRelocalization --> NeedsRelocalization: Match remains weak / retry
    CameraV2 --> ProjectingV2: Live detections use map v2
```

This revision boundary is why the scene carries map IDs for geometry,
registrations, and observations. A stale registration is not silently reused.

## 9. What ONE keeps and what stays transient

The visual pipeline is designed so raw frames are working data, while the
useful spatial result is retained as derived geometry and registration state.

```mermaid
flowchart LR
    subgraph Transient["Transient processing input"]
        sweep["Browser sweep RGB frames"]
        scanRgb["RoomPlan landmark RGB samples"]
        scanDepth["LiDAR depth samples"]
        liveFrames["Live detection frames"]
    end

    subgraph Derived["Derived data that can be retained"]
        map2d["camera-cv-2d geometry"]
        map3d["Normalized RoomPlan geometry"]
        landmarks["Visual landmark descriptors<br/>+ metric points"]
        pose["camera_to_world<br/>+ localization quality"]
        observations["Stable derived observations"]
    end

    sweep --> map2d
    scanRgb --> landmarks
    scanDepth --> landmarks
    scanRgb --> map3d
    scanDepth --> map3d
    liveFrames --> observations
    landmarks --> pose
    pose --> observations
```

Raw browser walkthrough frames, RoomPlan landmark RGB/depth samples, and live
vision frames are bounded processing inputs. The persistent value is the
normalized room geometry, derived landmark index, camera registration, and
stable observations required for the product experience.

## End-to-end mental model

If you only remember one picture, use this one:

```mermaid
flowchart LR
    scan["1 · Scan room<br/>LiDAR + RGB + ARKit"] --> map["2 · Build metric map<br/>roomplan-lidar-3d"]
    map --> localize["3 · Propose fixed-camera pose<br/>ORB + PnP/RANSAC"]
    localize --> review["4 · Review placement<br/>confirm or adjust manually"]
    review --> activate["5 · Activate reviewed transform"]
    activate --> detect["6 · Detect locally<br/>YOLO + stability"]
    detect --> project["7 · Project into map<br/>camera_to_world"]
    project --> understand["8 · Render context<br/>room + camera + observations"]
```

For exact route names, validation rules, failure states, and payload fields,
continue with [Camera mapping](/architecture/camera-mapping),
[Spatial models, maps & detection](/api/spatial-vision), and
[Homes, rooms & calibration](/api/homes).
