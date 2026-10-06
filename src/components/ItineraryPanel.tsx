import { useRef, useState } from "react";
import { downloadItinerary, readItineraryFile } from "../lib/itineraryFile";
import { formatDuration } from "../lib/format";
import type { Stop, TripRoute } from "../types";
import { StopList } from "./StopList";

type ItineraryPanelProps = {
  stops: Stop[];
  route: TripRoute | null;
  routeError: string | null;
  isRouting: boolean;
  onReorder: (stops: Stop[]) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  onImport: (stops: Stop[]) => void;
};

export function ItineraryPanel({
  stops,
  route,
  routeError,
  isRouting,
  onReorder,
  onRemove,
  onClear,
  onImport,
}: ItineraryPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const totalLabel = route
    ? formatDuration(route.durationSeconds)
    : stops.length < 2
      ? "—"
      : "…";
  const stopLabel = stops.length === 1 ? "1 stop" : `${stops.length} stops`;
  const errorMessage = importError ?? routeError;

  async function handleImport(file: File) {
    try {
      const nextStops = await readItineraryFile(file);
      if (!nextStops) {
        setImportError(
          "Could not import that file. Use a JSON export from this app.",
        );
        return;
      }

      setImportError(null);
      onImport(nextStops);
    } catch {
      setImportError(
        "Could not import that file. Use a JSON export from this app.",
      );
    }
  }

  return (
    <aside
      className={expanded ? "itinerary-panel is-expanded" : "itinerary-panel"}
    >
      <div className="itinerary-header">
        <button
          type="button"
          className="sheet-toggle"
          aria-expanded={expanded}
          onClick={() => setExpanded((current) => !current)}
        >
          <span className="sheet-grabber" aria-hidden="true" />
          <span className="sheet-copy">
            <strong>Itinerary</strong>
            <span>
              {stopLabel}
              {totalLabel !== "—" ? ` · ${totalLabel}` : ""}
            </span>
          </span>
        </button>
        <div className="itinerary-meta">
          <h2>Itinerary</h2>
          <p>
            {stopLabel}
            {route ? ` · ${formatDuration(route.durationSeconds)} total` : ""}
            {isRouting ? " · Updating route…" : ""}
          </p>
        </div>
        <div className="itinerary-actions">
          <button
            type="button"
            className="trip-action"
            onClick={() => {
              setImportError(null);
              downloadItinerary(stops);
            }}
            disabled={stops.length === 0}
          >
            Export
          </button>
          <button
            type="button"
            className="trip-action"
            onClick={() => {
              setImportError(null);
              fileInputRef.current?.click();
            }}
          >
            Import
          </button>
          <button
            type="button"
            className="clear-trip"
            onClick={() => {
              setImportError(null);
              onClear();
            }}
            disabled={stops.length === 0}
          >
            Clear trip
          </button>
          <input
            ref={fileInputRef}
            className="file-input"
            type="file"
            accept="application/json,.json"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) {
                void handleImport(file);
              }
            }}
          />
        </div>
      </div>

      {errorMessage ? <p className="itinerary-error">{errorMessage}</p> : null}

      <div className="itinerary-body">
        {stops.length === 0 ? (
          <p className="itinerary-empty">
            Search the map to add your first stop.
          </p>
        ) : (
          <StopList
            stops={stops}
            route={route}
            onReorder={(next) => {
              setImportError(null);
              onReorder(next);
            }}
            onRemove={(id) => {
              setImportError(null);
              onRemove(id);
            }}
          />
        )}
      </div>
    </aside>
  );
}
