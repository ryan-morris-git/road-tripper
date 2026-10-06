import { useEffect, useState } from "react";
import { fetchDrivingRoute, MAX_ROUTE_STOPS } from "../lib/mapbox";
import {
  clearItineraryStorage,
  readItinerary,
  writeItinerary,
} from "../lib/storage";
import type { Stop, TripRoute } from "../types";

export type NewStop = Omit<Stop, "id">;

const WAYPOINT_LIMIT_MESSAGE = `You can only add at most ${MAX_ROUTE_STOPS} stops. Remove some stops to recalculate the route.`;

function persistStops(stops: Stop[]): void {
  try {
    writeItinerary(stops);
  } catch {
    // Keep the in-memory itinerary if storage is unavailable.
  }
}

function shouldFetchRoute(stopCount: number): boolean {
  return stopCount >= 2 && stopCount <= MAX_ROUTE_STOPS;
}

export function useItinerary(token: string | undefined) {
  const [stops, setStops] = useState<Stop[]>(() => readItinerary());
  const [route, setRoute] = useState<TripRoute | null>(null);
  const [routeError, setRouteError] = useState<string | null>(() => {
    const count = readItinerary().length;
    return count > MAX_ROUTE_STOPS ? WAYPOINT_LIMIT_MESSAGE : null;
  });
  const [isRouting, setIsRouting] = useState(
    () => Boolean(token) && shouldFetchRoute(readItinerary().length),
  );

  function commitStops(next: Stop[]) {
    setStops(next);

    if (next.length === 0) {
      clearItineraryStorage();
    } else {
      persistStops(next);
    }

    if (next.length < 2) {
      setRoute(null);
      setRouteError(null);
      setIsRouting(false);
      return;
    }

    if (next.length > MAX_ROUTE_STOPS) {
      setRoute(null);
      setRouteError(WAYPOINT_LIMIT_MESSAGE);
      setIsRouting(false);
      return;
    }

    setIsRouting(Boolean(token));
    setRouteError(null);
  }

  useEffect(() => {
    if (!token || !shouldFetchRoute(stops.length)) {
      return;
    }

    const controller = new AbortController();

    void fetchDrivingRoute(stops, token, controller.signal)
      .then((nextRoute) => {
        setRoute(nextRoute);
        setRouteError(null);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setRoute(null);
        if (error instanceof Error && error.message === "waypoint-limit") {
          setRouteError(WAYPOINT_LIMIT_MESSAGE);
          return;
        }

        setRouteError(
          "Could not calculate a driving route. Try different stops.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsRouting(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [stops, token]);

  function addStop(stop: NewStop) {
    commitStops([...stops, { ...stop, id: crypto.randomUUID() }]);
  }

  function removeStop(id: string) {
    commitStops(stops.filter((stop) => stop.id !== id));
  }

  function reorderStops(next: Stop[]) {
    commitStops(next);
  }

  function clearTrip() {
    commitStops([]);
  }

  function importStops(next: Stop[]) {
    commitStops(next);
  }

  return {
    stops,
    route,
    routeError,
    isRouting,
    addStop,
    removeStop,
    reorderStops,
    clearTrip,
    importStops,
  };
}
