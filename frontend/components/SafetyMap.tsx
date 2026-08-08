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
  source?: string
  created_at?: string
  news_url?: string
}

interface Hotspot {
  lat: number
  lng: number
  radius: number
  level: string
  count?: number
  type?: string
}

interface SafeHaven {
  name: string
  lat: number
  lng: number
  phone?: string
  ref?: string
}

interface MapProps {
  incidents?: Incident[]
  heatmapPoints?: [number, number, number][]
  hotspots?: Hotspot[]
  safeHavens?: SafeHaven[]
  route?: { lat: number; lng: number }[] | null
  onMapClick?: (e: any) => void
  center?: [number, number]
  zoom?: number
  userLocation?: [number, number] | null
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
  safeHavens = [],
  route = null,
  onMapClick,
  center = [28.6139, 77.2090],
  zoom = 13,
  userLocation
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

      {/* Current User Location Pin */}
      {userLocation && (
        <CircleMarker
          center={userLocation}
          radius={8}
          color="#ffffff"
          fillColor="#3b82f6"
          fillOpacity={1}
          weight={2}
          className="animate-pulse"
        >
          <Popup><div className="font-bold">You are here</div></Popup>
        </CircleMarker>
      )}

      {/* Safe Havens Layer */}
      {safeHavens && safeHavens.map((sh, idx) => (
        <CircleMarker
          key={`haven-${idx}`}
          center={[sh.lat, sh.lng]}
          radius={8}
          color="#3b82f6" /* blue border */
          fillColor="#60a5fa"
          fillOpacity={0.8}
          weight={2}
        >
          <Popup className="custom-popup min-w-[200px]">
            <div className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">👮‍♂️</span>
                <h4 className="font-bold text-gray-800 dark:text-white capitalize leading-tight">
                  {sh.name}
                </h4>
              </div>
              <div className="flex flex-col gap-1 text-xs text-gray-600 dark:text-gray-300">
                {sh.phone && <div>📞 {sh.phone}</div>}
              </div>
            </div>
          </Popup>
        </CircleMarker>
      ))}

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
        
        let cred = { label: 'Community Report', stars: '★★★☆☆', icon: '👤' }
        if (inc.source === 'newsapi' || inc.source === 'gnews') cred = { label: 'AI-Verified News', stars: '★★★★☆', icon: '📰' }
        else if (inc.source === 'sos') cred = { label: 'Emergency Report', stars: '★★★★★', icon: '🆘' }
        else if (inc.source === 'seed_data') cred = { label: 'Historical Data', stars: '★★☆☆☆', icon: '🕰️' }
        
        const timeStr = inc.created_at ? new Date(inc.created_at).toLocaleDateString() : 'Recent'

        return (
          <CircleMarker
            key={`incident-${i}`}
            center={[inc.lat, inc.lng]}
            radius={inc.severity ? Math.max(5, Math.min(12, inc.severity)) : 7}
            pathOptions={{ color: c.stroke, fillColor: c.fill, fillOpacity: 0.85, weight: 2 }}
          >
            <Popup className="incident-popup">
              <div className="p-1 min-w-[220px]">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div className="font-bold capitalize text-sm" style={{ color: c.stroke }}>
                    {inc.zone === 'red' ? '⚠️' : '⚡'} {inc.type?.replace('_', ' ') || 'Incident'}
                  </div>
                  <div className="text-xs" style={{ background: c.fill, color: '#fff', padding: '2px 6px', borderRadius: 4, fontWeight: 'bold' }}>
                    {inc.zone?.toUpperCase()} ZONE
                  </div>
                </div>
                
                <div className="text-sm mb-2" style={{ fontStyle: 'italic', color: '#333' }}>
                  &quot;{inc.summary}&quot;
                </div>
                
                <div className="text-xs text-gray-600 mb-2 border-l-2 pl-2" style={{ borderColor: c.stroke }}>
                  <div>📍 <b>Location:</b> {inc.lat.toFixed(4)}, {inc.lng.toFixed(4)}</div>
                  <div>🕐 <b>Reported:</b> {timeStr}</div>
                  {inc.severity && <div>🚨 <b>Severity:</b> {inc.severity}/10</div>}
                </div>
                
                <div style={{ background: '#f8fafc', padding: '6px', borderRadius: '4px', fontSize: '11px', marginTop: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <span style={{ fontWeight: 'bold', color: '#475569' }}>{cred.icon} Source:</span>
                    <span>{inc.source || 'user_report'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 'bold', color: '#475569' }}>Credibility:</span>
                    <span style={{ color: '#059669', letterSpacing: '1px' }} title={cred.label}>{cred.stars}</span>
                  </div>
                  {inc.news_url && (
                    <div style={{ marginTop: 4, textAlign: 'right' }}>
                      <a href={inc.news_url} target="_blank" rel="noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>Read Article →</a>
                    </div>
                  )}
                </div>
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
