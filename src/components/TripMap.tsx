import { useEffect, useMemo, useRef, type RefObject } from "react";
import Map, {
  Layer,
  Marker,
  NavigationControl,
  Source,
  type MapRef,
} from "react-map-gl/mapbox";
import { LngLatBounds } from "mapbox-gl";
import type { LineStringGeometry, MapCenter, Stop } from "../types";

const WORLD_VIEW = {
  longitude: 0,
  latitude: 20,
  zoom: 1.6,
};

const DESKTOP_QUERY = "(min-width: 900px)";

type TripMapProps = {
  token: string;
  stops: Stop[];
  routeGeometry: LineStringGeometry | null;
  proximityRef: RefObject<MapCenter | undefined>;
};

type Padding = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

function motionDuration(): number {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? 0
    : 700;
}

function getPadding(): Padding {
  const isDesktop = window.matchMedia(DESKTOP_QUERY).matches;
  return isDesktop
    ? { top: 132, right: 24, bottom: 24, left: 24 }
    : { top: 132, right: 24, bottom: 128, left: 24 };
}

function getBrowserLocation(): Promise<MapCenter | null> {
  if (!navigator.geolocation) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lng: position.coords.longitude,
          lat: position.coords.latitude,
        });
      },
      () => resolve(null),
      { enableHighAccuracy: false, maximumAge: 300_000, timeout: 5_000 },
    );
  });
}

function fitItinerary(
  map: MapRef,
  stops: Stop[],
  geometry: LineStringGeometry | null,
  padding: Padding,
) {
  const duration = motionDuration();

  if (stops.length === 1 && !geometry) {
    map.flyTo({
      center: [stops[0].lng, stops[0].lat],
      zoom: 11,
      padding,
      duration,
    });
    return;
  }

  const bounds = new LngLatBounds();
  if (geometry) {
    for (const coordinate of geometry.coordinates) {
      bounds.extend(coordinate);
    }
  } else {
    for (const stop of stops) {
      bounds.extend([stop.lng, stop.lat]);
    }
  }

  map.fitBounds(bounds, { padding, duration, maxZoom: 12 });
}

async function goToUserOrWorld(
  map: MapRef,
  padding: Padding,
  proximityRef: RefObject<MapCenter | undefined>,
) {
  const duration = motionDuration();
  const location = await getBrowserLocation();

  if (location) {
    map.flyTo({
      center: [location.lng, location.lat],
      zoom: 9,
      padding,
      duration,
    });
    proximityRef.current = location;
    return;
  }

  map.flyTo({
    center: [WORLD_VIEW.longitude, WORLD_VIEW.latitude],
    zoom: WORLD_VIEW.zoom,
    padding,
    duration,
  });
}

export function TripMap({
  token,
  stops,
  routeGeometry,
  proximityRef,
}: TripMapProps) {
  const mapRef = useRef<MapRef>(null);
  const lastFitKey = useRef("");

  const routeKey = routeGeometry
  ? `${routeGeometry.coordinates.length}:${routeGeometry.coordinates[0]?.join(",")}:${routeGeometry.coordinates.at(-1)?.join(",")}`
  : "";
  
  const fitKey = `${stops.map((stop) => stop.id).join(">")}|${routeKey}`;
  
  const bounds = new LngLatBounds();
  if (routeGeometry) {
    for (const coordinate of routeGeometry.coordinates) {
      bounds.extend(coordinate);
    }
  }
  for (const stop of stops) {
    bounds.extend([stop.lng, stop.lat]);
  }


  const routeData = useMemo(
    () =>
      routeGeometry
        ? {
            type: "Feature" as const,
            properties: {},
            geometry: routeGeometry,
          }
        : null,
    [routeGeometry],
  );

  useEffect(() => {
    const map = mapRef.current;
    if (!map || lastFitKey.current === fitKey) {
      return;
    }

    lastFitKey.current = fitKey;
    const padding = getPadding();

    if (stops.length === 0) {
      void goToUserOrWorld(map, padding, proximityRef);
      return;
    }

    fitItinerary(map, stops, routeGeometry, padding);
  }, [fitKey, proximityRef, routeGeometry, stops]);

  return (
    <Map
      ref={mapRef}
      mapboxAccessToken={token}
      mapStyle="mapbox://styles/mapbox/streets-v12"
      style={{ width: "100%", height: "100%" }}
      initialViewState={WORLD_VIEW}
      attributionControl
      onLoad={() => {
        const map = mapRef.current;
        if (!map || lastFitKey.current === fitKey) {
          return;
        }

        lastFitKey.current = fitKey;
        const padding = getPadding();
        if (stops.length === 0) {
          void goToUserOrWorld(map, padding, proximityRef);
          return;
        }
        fitItinerary(map, stops, routeGeometry, padding);
      }}
      onMoveEnd={(event) => {
        proximityRef.current = {
          lng: event.viewState.longitude,
          lat: event.viewState.latitude,
        };
      }}
    >
      <NavigationControl position="bottom-right" showCompass={false} />
      {routeData ? (
        <Source id="route" type="geojson" data={routeData}>
          <Layer
            id="route-line"
            type="line"
            layout={{ "line-cap": "round", "line-join": "round" }}
            paint={{
              "line-color": "#219ebc",
              "line-width": 4,
              "line-opacity": 0.85,
            }}
          />
        </Source>
      ) : null}
      {stops.map((stop, index) => (
        <Marker
          key={stop.id}
          longitude={stop.lng}
          latitude={stop.lat}
          anchor="bottom"
        >
          <div className="stop-marker" aria-hidden="true">
            {index + 1}
          </div>
        </Marker>
      ))}
    </Map>
  );
}
