<p align="center">
  <img src="public/one-logo.png" alt="ONE logo" width="128" />
</p>

# ONE documentation

Polished Vocs documentation for the ONE local-first cognitive companion MVP. The content is grounded in the sibling repositories:

- `one`: FastAPI backend and Docker wiring
- `one-frontend`: React/Vite dashboard and browser publisher
- `one-ios`: SwiftUI app and RoomPlan capture surface

## Run locally

```bash
npm ci
npm run dev
```

Build the static site with:

```bash
npm run build
```

The site uses Vocs 2.9, TypeScript configuration, and `style.css` for the ONE shell: white canvas, oversized black typography, thin gray outlines, rounded surfaces, and blue/cyan accents. `public/one-logo.png` is the shared mark used by the Vocs navigation and favicon configuration. `dist/` is generated and ignored; `package-lock.json` is tracked for reproducible installs.

## Mapping documentation

The map contract is intentionally split by provenance: a browser camera can
produce relative 2D geometry after a guided sweep, while a 3D model requires a
validated native iPhone or iPad LiDAR RoomPlan artifact. See
[Camera mapping](pages/architecture/camera-mapping.md) for the behavioral
job states, privacy boundary, local M3 Pro worker contract, exact current
backend map routes, and the remaining native iOS RoomPlan producer work.

## Content boundary

Documentation describes the current checkout, including known demo-only and deployment-intent paths. It never includes real `.env` values, keys, bearer tokens, resident data, or copied secrets. Update the relevant page when a sibling repository’s implementation changes.
