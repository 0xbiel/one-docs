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

The site uses Vocs 2.9, TypeScript configuration, and `style.css` for the ONE shell: white canvas, oversized black typography, thin gray outlines, rounded surfaces, and blue/cyan accents. `dist/` is generated and ignored; `package-lock.json` is tracked for reproducible installs.

## Content boundary

Documentation describes the current checkout, including known demo-only and deployment-intent paths. It never includes real `.env` values, keys, bearer tokens, resident data, or copied secrets. Update the relevant page when a sibling repository’s implementation changes.
