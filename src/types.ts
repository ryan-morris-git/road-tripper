export type Stop = {
  id: string
  name: string
  lng: number
  lat: number
}

export type PersistedItinerary = {
  version: 1
  stops: Stop[]
}

export type RouteLeg = {
  durationSeconds: number
}

export type LineStringGeometry = {
  type: 'LineString'
  coordinates: [number, number][]
}

export type TripRoute = {
  durationSeconds: number
  legs: RouteLeg[]
  geometry: LineStringGeometry
}

export type PlaceSuggestion = {
  id: string
  name: string
  lng: number
  lat: number
}

export type MapCenter = {
  lng: number
  lat: number
}
