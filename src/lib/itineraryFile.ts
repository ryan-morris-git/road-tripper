import { parseItineraryJson, toItineraryPayload } from "./storage";
import type { Stop } from "../types";

const MAX_IMPORT_BYTES = 256_000;

export function serializeItinerary(stops: Stop[]): string {
  return `${JSON.stringify(toItineraryPayload(stops), null, 2)}\n`;
}

export function downloadItinerary(stops: Stop[]): void {
  const blob = new Blob([serializeItinerary(stops)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const date = new Date().toISOString().slice(0, 10);
  anchor.href = url;
  anchor.download = `road-tripper-${date}.json`;
  anchor.rel = "noopener";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export async function readItineraryFile(
  file: File,
): Promise<Stop[] | undefined> {
  if (file.size > MAX_IMPORT_BYTES) {
    return undefined;
  }

  const text = await file.text();
  const stops = parseItineraryJson(text);
  if (!stops) {
    return undefined;
  }

  return stops.map((stop) => ({ ...stop, id: crypto.randomUUID() }));
}
