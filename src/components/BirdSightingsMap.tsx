import { MapContainer, TileLayer, CircleMarker, useMap, useMapEvents } from 'react-leaflet'
import type { LeafletMouseEvent } from 'leaflet'
import { useEffect } from 'react'
import type { BirdSighting } from '../interfaces/BirdSighting'

import 'leaflet/dist/leaflet.css'

export const ROORKEE_CENTER: [number, number] = [29.8543, 77.8880]

interface BirdSightingsMapProps {
  sightings: BirdSighting[]
  selectedSightingId?: string | null
  onSelect?: (sightingId: string) => void
  onMapClick?: (coords: [number, number]) => void
  selectedCoords?: [number, number] | null
  heightClassName?: string
  zoom?: number
}

const MapResizeFix = () => {
  const map = useMap()

  useEffect(() => {
    const timer = window.setTimeout(() => map.invalidateSize(), 0)
    return () => window.clearTimeout(timer)
  }, [map])

  return null
}

const MapClickHandler = ({ onMapClick }: { onMapClick?: (coords: [number, number]) => void }) => {
  useMapEvents({
    click: (event: LeafletMouseEvent) => {
      onMapClick?.([event.latlng.lat, event.latlng.lng])
    },
  })
  return null
}

const BirdSightingsMap = ({
  sightings,
  selectedSightingId,
  onSelect,
  onMapClick,
  selectedCoords,
  heightClassName = 'h-[420px]',
  zoom = 13,
}: BirdSightingsMapProps) => {
  return (
    <div className={`w-full overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl ${heightClassName}`}>
      <MapContainer center={ROORKEE_CENTER} zoom={zoom} scrollWheelZoom className="h-full w-full z-0">
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapResizeFix />
        <MapClickHandler onMapClick={onMapClick} />
        {selectedCoords && (
          <CircleMarker
            center={selectedCoords}
            radius={9}
            pathOptions={{ color: '#dc2626', fillColor: '#dc2626', fillOpacity: 0.95, weight: 3 }}
          />
        )}
        {sightings.map((sighting) => {
          const hasPhoto = Boolean(sighting.photoId)
          const selected = selectedSightingId === sighting.sightingId || selectedSightingId === sighting.id
          const color = hasPhoto ? '#16a34a' : '#2563eb'

          return (
            <CircleMarker
              key={sighting.sightingId || sighting.id}
              center={sighting.mapCoords}
              radius={selected ? 10 : 6}
              pathOptions={{
                color,
                fillColor: color,
                fillOpacity: selected ? 1 : 0.85,
                weight: selected ? 4 : 2,
              }}
              eventHandlers={{
                click: () => onSelect?.(sighting.sightingId || sighting.id),
              }}
            />
          )
        })}
      </MapContainer>
    </div>
  )
}

export default BirdSightingsMap
