import type { PersistedItinerary, Stop } from '../types'

export const ITINERARY_STORAGE_KEY = 'road-tripper:itinerary'

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isStop(value: unknown): value is Stop {
  if (value === null || typeof value !== 'object') {
    return false
  }

  const stop = value as Partial<Stop>
  return (
    typeof stop.id === 'string' &&
    stop.id.length > 0 &&
    typeof stop.name === 'string' &&
    stop.name.length > 0 &&
    isFiniteNumber(stop.lng) &&
    isFiniteNumber(stop.lat) &&
    stop.lng >= -180 &&
    stop.lng <= 180 &&
    stop.lat >= -90 &&
    stop.lat <= 90
  )
}

export function isPersistedItinerary(value: unknown): value is PersistedItinerary {
  if (value === null || typeof value !== 'object') {
    return false
  }

  const payload = value as Partial<PersistedItinerary>
  return payload.version === 1 && Array.isArray(payload.stops) && payload.stops.every(isStop)
}

export function toItineraryPayload(stops: Stop[]): PersistedItinerary {
  return { version: 1, stops }
}

export function parseItineraryJson(text: string): Stop[] | undefined {
  try {
    const parsed: unknown = JSON.parse(text)
    if (!isPersistedItinerary(parsed)) {
      return undefined
    }
    return parsed.stops
  } catch {
    return undefined
  }
}

export function readItinerary(): Stop[] {
  try {
    const raw = localStorage.getItem(ITINERARY_STORAGE_KEY)
    if (!raw) {
      return []
    }

    return parseItineraryJson(raw) ?? []
  } catch {
    return []
  }
}

export function writeItinerary(stops: Stop[]): void {
  localStorage.setItem(ITINERARY_STORAGE_KEY, JSON.stringify(toItineraryPayload(stops)))
}

export function clearItineraryStorage(): void {
  localStorage.removeItem(ITINERARY_STORAGE_KEY)
}
