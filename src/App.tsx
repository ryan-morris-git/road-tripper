import { useRef } from 'react'
import { ItineraryPanel } from './components/ItineraryPanel'
import { SearchBox } from './components/SearchBox'
import { TokenField } from './components/TokenField'
import { TripMap } from './components/TripMap'
import { useItinerary } from './hooks/useItinerary'
import { useMapboxToken } from './hooks/useMapboxToken'
import type { MapCenter } from './types'
import './App.css'

function App() {
  const { input, token, update } = useMapboxToken()
  const itinerary = useItinerary(token)
  const proximityRef = useRef<MapCenter | undefined>(undefined)

  return (
    <div className="app">
      <div className="map-area">
        <div className="map-controls">
          <TokenField value={input} onChange={update} />
          <SearchBox token={token} proximityRef={proximityRef} onSelect={itinerary.addStop} />
        </div>
        {token ? (
          <TripMap
            key={token}
            token={token}
            stops={itinerary.stops}
            routeGeometry={itinerary.route?.geometry ?? null}
            proximityRef={proximityRef}
          />
        ) : (
          <div className="map-placeholder">
            <p>Paste a public Mapbox token to load the map.</p>
          </div>
        )}
      </div>
      <ItineraryPanel
        stops={itinerary.stops}
        route={token ? itinerary.route : null}
        routeError={itinerary.routeError}
        isRouting={Boolean(token) && itinerary.isRouting}
        onReorder={itinerary.reorderStops}
        onRemove={itinerary.removeStop}
        onClear={itinerary.clearTrip}
        onImport={itinerary.importStops}
      />
    </div>
  )
}

export default App
