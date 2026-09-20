# Road trip planner

A single-page itinerary planner. Search for stops, reorder them, and Mapbox calculates the driving route and time between each one.

## Setup

```bash
pnpm install
pnpm dev
```

Paste a **public** Mapbox token (`pk.…`) into the token field on the map. Create one in the [Mapbox access tokens](https://account.mapbox.com/access-tokens/) dashboard. Do not use a secret token (`sk.…`).

Use **Export** / **Import** in the itinerary panel to save the trip as JSON or load one back. Import replaces the current stops. The Mapbox token is not included in the file.
