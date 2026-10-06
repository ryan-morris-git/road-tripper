import type {
  LineStringGeometry,
  MapCenter,
  PlaceSuggestion,
  Stop,
  TripRoute,
} from "../types";

export const MAX_ROUTE_STOPS = 40;

export function parseMapboxToken(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed.startsWith("pk.") || trimmed.length < 20) {
    return undefined;
  }

  return trimmed;
}

type GeocodeFeature = {
  id?: string;
  geometry?: {
    type?: string;
    coordinates?: unknown;
  };
  properties?: {
    mapbox_id?: string;
    name?: string;
    full_address?: string;
    place_formatted?: string;
  };
};

type GeocodeResponse = {
  features?: GeocodeFeature[];
};

type DirectionsLeg = {
  duration?: number;
};

type DirectionsRoute = {
  duration?: number;
  geometry?: {
    type?: string;
    coordinates?: unknown;
  };
  legs?: DirectionsLeg[];
};

type DirectionsResponse = {
  routes?: DirectionsRoute[];
};

function isLngLat(value: unknown): value is [number, number] {
  return (
    Array.isArray(value) &&
    value.length >= 2 &&
    typeof value[0] === "number" &&
    typeof value[1] === "number" &&
    Number.isFinite(value[0]) &&
    Number.isFinite(value[1])
  );
}

function featureName(feature: GeocodeFeature): string | undefined {
  const fullAddress = feature.properties?.full_address?.trim();
  if (fullAddress) {
    return fullAddress;
  }

  const name = feature.properties?.name?.trim();
  const place = feature.properties?.place_formatted?.trim();
  if (name && place) {
    return `${name}, ${place}`;
  }

  return name || place;
}

export async function searchPlaces(
  query: string,
  proximity: MapCenter | undefined,
  token: string,
  signal?: AbortSignal,
): Promise<PlaceSuggestion[]> {
  const params = new URLSearchParams({
    q: query,
    limit: "5",
    language: "en",
    access_token: token,
  });

  if (proximity) {
    params.set("proximity", `${proximity.lng},${proximity.lat}`);
  }

  const response = await fetch(
    `https://api.mapbox.com/search/geocode/v6/forward?${params}`,
    {
      signal,
    },
  );

  if (!response.ok) {
    throw new Error("Search failed");
  }

  const data = (await response.json()) as GeocodeResponse;
  const suggestions: PlaceSuggestion[] = [];

  for (const feature of data.features ?? []) {
    const coordinates = feature.geometry?.coordinates;
    const name = featureName(feature);
    if (feature.geometry?.type !== "Point" || !isLngLat(coordinates) || !name) {
      continue;
    }

    suggestions.push({
      id:
        feature.properties?.mapbox_id ??
        feature.id ??
        `${coordinates[0]},${coordinates[1]},${name}`,
      name,
      lng: coordinates[0],
      lat: coordinates[1],
    });
  }

  return suggestions;
}

export async function fetchDrivingRoute(
  stops: Pick<Stop, "lng" | "lat">[],
  token: string,
  signal?: AbortSignal,
): Promise<TripRoute> {
  if (stops.length > MAX_ROUTE_STOPS) {
    throw new Error("waypoint-limit");
  }

  if (stops.length < 2) {
    throw new Error("need-two-stops");
  }

  for (const stop of stops) {
    if (!Number.isFinite(stop.lng) || !Number.isFinite(stop.lat)) {
      throw new Error("invalid-coordinates");
    }
  }

  const path = stops.map((stop) => `${stop.lng},${stop.lat}`).join(";");
  const params = new URLSearchParams({
    geometries: "geojson",
    overview: "full",
    access_token: token,
  });

  const response = await fetch(
    `https://api.mapbox.com/directions/v5/mapbox/driving/${path}?${params}`,
    { signal },
  );

  if (!response.ok) {
    throw new Error("request-failed");
  }

  const data = (await response.json()) as DirectionsResponse;
  const route = data.routes?.[0];
  const coordinates = route?.geometry?.coordinates;
  const duration = route?.duration;
  const legs = route?.legs;

  if (
    !route ||
    route.geometry?.type !== "LineString" ||
    !Array.isArray(coordinates) ||
    typeof duration !== "number" ||
    !Number.isFinite(duration) ||
    !Array.isArray(legs)
  ) {
    throw new Error("no-route");
  }

  const lineCoordinates: [number, number][] = [];
  for (const coordinate of coordinates) {
    if (!isLngLat(coordinate)) {
      throw new Error("no-route");
    }
    lineCoordinates.push([coordinate[0], coordinate[1]]);
  }

  const geometry: LineStringGeometry = {
    type: "LineString",
    coordinates: lineCoordinates,
  };

  return {
    durationSeconds: duration,
    geometry,
    legs: legs.map((leg) => {
      if (typeof leg.duration !== "number" || !Number.isFinite(leg.duration)) {
        throw new Error("no-route");
      }
      return { durationSeconds: leg.duration };
    }),
  };
}
