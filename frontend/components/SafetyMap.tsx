'use client'
import { MapContainer, TileLayer, CircleMarker, Popup, useMap, Circle, Polyline } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect } from 'react'

interface Incident {
  lat: number
  lng: number
  type?: string
  severity?: number
  summary?: string
  zone?: string
}

interface Hotspot {
  lat: number
  lng: number
  radius: number
  level: string
  count?: number
  type?: string
}

interface MapProps {
  incidents?: Incident[]
  heatmapPoints?: [number, number, number][]
  hotspots?: Hotspot[]
  route?: { lat: number; lng: number }[] | null
  onMapClick?: (e: any) => void
  center?: [number, number]
  zoom?: number
}

function HeatmapLayer({ points }: { points: [number, number, number][] }) {
  const map = useMap()
  useEffect(() => {
    if (!points || points.length === 0) return
    let heatLayer: any = null
    // @ts-ignore
    import('leaflet.heat').then(() => {
      const L = require('leaflet')
      if (L.heatLayer) {
        heatLayer = L.heatLayer(points, {
          radius: 28,
          blur: 18,
          maxZoom: 17,
          max: 1.0,
          gradient: { 0.2: '#22c55e', 0.5: '#f59e0b', 0.75: '#ef4444', 1.0: '#dc2626' }
        }).addTo(map)
      }
    })
    return () => { try { if (heatLayer && map) map.removeLayer(heatLayer) } catch {} }
  }, [map, points])
  return null
}

// Syncs the map view when center/zoom props change
function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap()
  useEffect(() => {
    if (center && center[0] !== 0 && center[1] !== 0) {
      map.flyTo(center, zoom, { animate: true, duration: 1.2 })
    }
  }, [map, center, zoom])
  return null
}

function MapEvents({ onClick }: { onClick?: (e: any) => void }) {
  const map = useMap()
  useEffect(() => {
    if (onClick) {
      map.on('click', onClick)
      return () => { map.off('click', onClick) }
    }
  }, [map, onClick])
  return null
}

const zoneColor = (zone?: string) => {
  if (zone === 'red') return { stroke: '#ef4444', fill: '#ef4444' }
  if (zone === 'yellow') return { stroke: '#f59e0b', fill: '#f59e0b' }
  return { stroke: '#22c55e', fill: '#22c55e' }
}

export default function SafetyMap({
  incidents = [],
  heatmapPoints = [],
  hotspots = [],
  route = null,
  onMapClick,
  center = [12.9716, 77.5946],
  zoom = 13
}: MapProps) {
  useEffect(() => {
    const L = require('leaflet')
    delete (L.Icon.Default.prototype as any)._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    })
  }, [])

  const routePositions: [number, number][] = route
    ? route.map((p: any) => [p.lat, p.lng] as [number, number])
    : []

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: '100%', width: '100%', background: '#0a0a1a' }}
      zoomControl={true}
    >
      {/* Dark tile layer */}
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        maxZoom={19}
      />

      {/* Update map center when prop changes */}
      <MapController center={center} zoom={zoom} />

      {/* Click handler */}
      <MapEvents onClick={onMapClick} />

      {/* Heatmap layer */}
      {heatmapPoints.length > 0 && <HeatmapLayer points={heatmapPoints} />}

      {/* Hotspot circles */}
      {hotspots.map((h, i) => {
        const c = zoneColor(h.level)
        return (
          <Circle
            key={`hotspot-${i}`}
            center={[h.lat, h.lng]}
            radius={h.radius || 500}
            pathOptions={{ color: c.stroke, fillColor: c.fill, fillOpacity: 0.15, weight: 2, dashArray: '5 5' }}
          >
            <Popup>
              <div className="p-1 text-black">
                <div className="font-bold capitalize">{h.level} Zone</div>
                {h.count && <div className="text-sm">{h.count} incidents</div>}
                {h.type && <div className="text-xs text-gray-600 capitalize">{h.type?.replace('_', ' ')}</div>}
              </div>
            </Popup>
          </Circle>
        )
      })}

      {/* Incident markers */}
      {incidents.map((inc, i) => {
        const c = zoneColor(inc.zone)
        return (
          <CircleMarker
            key={`incident-${i}`}
            center={[inc.lat, inc.lng]}
            radius={inc.severity ? Math.max(5, Math.min(12, inc.severity)) : 7}
            pathOptions={{ color: c.stroke, fillColor: c.fill, fillOpacity: 0.85, weight: 2 }}
          >
            <Popup>
              <div className="p-1 min-w-[160px]">
                <div className="font-bold mb-1 capitalize">{inc.type?.replace('_', ' ') || 'Incident'}</div>
                {inc.severity && <div className="text-sm text-gray-600 mb-1">Severity: {inc.severity}/10</div>}
                {inc.summary && <div className="text-xs">{inc.summary}</div>}
              </div>
            </Popup>
          </CircleMarker>
        )
      })}

      {/* Safe route polyline */}
      {routePositions.length > 1 && (
        <>
          {/* Shadow/glow effect */}
          <Polyline
            positions={routePositions}
            pathOptions={{ color: '#8b5cf6', weight: 8, opacity: 0.25, lineCap: 'round', lineJoin: 'round' }}
          />
          {/* Main route line */}
          <Polyline
            positions={routePositions}
            pathOptions={{ color: '#a78bfa', weight: 4, opacity: 0.95, lineCap: 'round', lineJoin: 'round', dashArray: '8 4' }}
          />
          {/* Start/end markers */}
          <CircleMarker center={routePositions[0]} radius={10} pathOptions={{ color: '#22c55e', fillColor: '#22c55e', fillOpacity: 1, weight: 3 }}>
            <Popup><div className="font-bold">Start</div></Popup>
          </CircleMarker>
          <CircleMarker center={routePositions[routePositions.length - 1]} radius={10} pathOptions={{ color: '#8b5cf6', fillColor: '#8b5cf6', fillOpacity: 1, weight: 3 }}>
            <Popup><div className="font-bold">Destination</div></Popup>
          </CircleMarker>
        </>
      )}
    </MapContainer>
  )
}
