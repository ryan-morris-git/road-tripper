# Road tripper

[Live demo here](https://ryan-morris-git.github.io/road-tripper/)

A single-page road trip planner. Search for stops, reorder them, and Mapbox calculates the driving route and time between each one. I made this because I really just like planning out road trips (even if I never go on them) and I found that existing tools either lacked basic features that I wanted, had WAY too many features, or were locked behind an account creation. 
I used Mapbox extensively for another project so I knew this was a super basic thing to throw together, it's just as basic as it comes; provide a mapbox token, and create a road trip itinerary.
Originally just kept for personal use, decided to make it public.

## Setup

```bash
pnpm install
pnpm dev
```

Paste a **public** Mapbox token (`pk.…`) into the token field on the map. Create one in the [Mapbox access tokens](https://account.mapbox.com/access-tokens/) dashboard. Do not use a secret token (`sk.…`).

Use **Export** / **Import** in the itinerary panel to save the trip as JSON or load one back. Import replaces the current stops. The Mapbox token is not included in the file.
