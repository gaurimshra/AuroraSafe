'use client'
import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'
import RiskBadge from '@/components/RiskBadge'
import { getHeatmap, getIncidents, getZones, getRiskScore, getSafeRoute, getNearbyAlerts } from '@/lib/api'
import { geocodeAddress } from '@/lib/geocode'

const SafetyMap = dynamic(() => import('@/components/SafetyMap'), {
  ssr: false,
  loading: () => (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)', borderRadius: 'var(--r-lg)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🗺️</div>
        <Loader2 style={{ color: 'var(--primary)', animation: 'spin 1s linear infinite', width: 32, height: 32 }} />
        <p style={{ color: 'var(--text-3)', fontSize: 13, marginTop: 8 }}>Loading map...</p>
      </div>
    </div>
  )
})

type Tab = 'check' | 'route' | 'alerts'

export default function MapPage() {
  const [tab, setTab] = useState<Tab>('check')
  const [heatmapPoints, setHeatmapPoints] = useState<[number, number, number][]>([])
  const [incidents, setIncidents] = useState<any[]>([])
  const [hotspots, setHotspots] = useState<any[]>([])
  const [route, setRoute] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [mapCenter, setMapCenter] = useState<[number, number]>([12.9716, 77.5946])

  // Risk check
  const [riskAddr, setRiskAddr] = useState('')
  const [riskLat, setRiskLat] = useState('')
  const [riskLng, setRiskLng] = useState('')
  const [riskResult, setRiskResult] = useState<any>(null)
  const [riskLoading, setRiskLoading] = useState(false)
  const [riskErr, setRiskErr] = useState('')

  // Route
  const [origin, setOrigin] = useState('')
  const [dest, setDest] = useState('')
  const [routeResult, setRouteResult] = useState<any>(null)
  const [routeLoading, setRouteLoading] = useState(false)
  const [routeErr, setRouteErr] = useState('')

  // Alerts
  const [alerts, setAlerts] = useState<any[]>([])
  const [alertsLoading, setAlertsLoading] = useState(false)

  // Filter
  const [filter, setFilter] = useState<'all' | 'green' | 'yellow' | 'red'>('all')

  const fetchMapData = useCallback(async () => {
    try {
      const [heat, inc, zones] = await Promise.all([getHeatmap(), getIncidents({ limit: 200 }), getZones()])
      setHeatmapPoints(heat.map((p: any) => [p.lat, p.lng, p.weight] as [number, number, number]))
      setIncidents(inc.map((i: any) => ({ lat: i.latitude, lng: i.longitude, type: i.incident_type, severity: i.severity, summary: i.ai_summary || i.description, zone: i.zone })))
      setHotspots(zones.map((z: any) => ({ lat: z.lat, lng: z.lng, radius: z.radius * 1000, level: z.risk_level, count: z.incident_count, type: z.dominant_type })))
    } catch { } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchMapData(); const t = setInterval(fetchMapData, 30000); return () => clearInterval(t) }, [fetchMapData])

  const getMyLoc = (cb: (lat: string, lng: string) => void) => {
    navigator.geolocation?.getCurrentPosition(p => cb(p.coords.latitude.toFixed(6), p.coords.longitude.toFixed(6)))
  }

  const handleRisk = async () => {
    setRiskErr(''); setRiskResult(null); setRiskLoading(true)
    try {
      let lat = parseFloat(riskLat), lng = parseFloat(riskLng)
      if (riskAddr.trim()) {
        const g = await geocodeAddress(riskAddr)
        if (!g) { setRiskErr('Address not found.'); setRiskLoading(false); return }
        lat = g.lat; lng = g.lng; setRiskLat(lat.toFixed(6)); setRiskLng(lng.toFixed(6))
      } else if (isNaN(lat) || isNaN(lng)) { setRiskErr('Enter valid coordinates or address.'); setRiskLoading(false); return }
      setMapCenter([lat, lng])
      const r = await getRiskScore(lat, lng)
      setRiskResult(r)
    } catch { setRiskErr('Failed. Is backend running?') } finally { setRiskLoading(false) }
  }

  const handleRoute = async () => {
    setRouteErr(''); setRouteResult(null); setRoute(null); setRouteLoading(true)
    try {
      const og = await geocodeAddress(origin); if (!og) { setRouteErr('Origin not found.'); setRouteLoading(false); return }
      const dg = await geocodeAddress(dest); if (!dg) { setRouteErr('Destination not found.'); setRouteLoading(false); return }
      const r = await getSafeRoute({ lat: og.lat, lng: og.lng }, { lat: dg.lat, lng: dg.lng })
      setRouteResult(r); setRoute(r.waypoints)
      setMapCenter([(og.lat + dg.lat) / 2, (og.lng + dg.lng) / 2])
    } catch { setRouteErr('Route failed.') } finally { setRouteLoading(false) }
  }

  const loadAlerts = useCallback(async () => {
    setAlertsLoading(true)
    try {
      const fallback = async () => { const d = await getNearbyAlerts(12.9716, 77.5946, 5); setAlerts(d); setAlertsLoading(false) }
      if (!navigator.geolocation) { await fallback(); return }
      navigator.geolocation.getCurrentPosition(async p => {
        const d = await getNearbyAlerts(p.coords.latitude, p.coords.longitude, 5)
        setAlerts(d); setAlertsLoading(false)
      }, fallback)
    } catch { setAlertsLoading(false) }
  }, [])

  useEffect(() => { if (tab === 'alerts') loadAlerts() }, [tab, loadAlerts])

  const timeAgo = (d: string) => {
    const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000)
    if (m < 1) return 'Just now'; if (m < 60) return `${m}m ago`
    const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`; return `${Math.floor(h / 24)}d ago`
  }

  const filteredIncidents = filter === 'all' ? incidents : incidents.filter(i => i.zone === filter)

  const TABS: { key: Tab; label: string; icon: string }[] = [
    { key: 'check',  label: 'Risk Score', icon: '🔍' },
    { key: 'route',  label: 'Safe Route', icon: '🗺️' },
    { key: 'alerts', label: 'Alerts',     icon: '🔔' },
  ]

  return (
    <div style={{ display: 'flex', height: '100dvh', overflow: 'hidden' }}>
      {/* ── Map ── */}
      <div style={{ flex: 1, position: 'relative', padding: 16, paddingBottom: 0 }}>
        {/* Search + filter bar */}
        <div style={{
          position: 'absolute', top: 28, left: 28, right: 300, zIndex: 20,
          display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap'
        }}>
          {/* Filter chips */}
          <div className="glass" style={{ display: 'flex', gap: 6, padding: '8px 12px', borderRadius: 'var(--r-pill)' }}>
            {[
              { key: 'all',    label: 'All',     dot: 'var(--text-3)' },
              { key: 'green',  label: 'Safe',    dot: 'var(--safe)' },
              { key: 'yellow', label: 'Caution', dot: 'var(--warning)' },
              { key: 'red',    label: 'Danger',  dot: 'var(--danger)' },
            ].map(({ key, label, dot }) => (
              <button
                key={key}
                onClick={() => setFilter(key as any)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px',
                  borderRadius: 'var(--r-pill)', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                  background: filter === key ? 'var(--primary-subtle)' : 'transparent',
                  color: filter === key ? 'var(--primary)' : 'var(--text-2)',
                  transition: 'all 0.2s'
                }}
              >
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: dot, display: 'inline-block' }} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Live badge */}
        <div style={{ position: 'absolute', bottom: 28, left: 28, zIndex: 20 }}>
          <div className="glass" style={{ padding: '8px 14px', borderRadius: 'var(--r-pill)', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--safe)', boxShadow: '0 0 6px var(--safe)', animation: 'pulse 2s infinite' }} />
            <span style={{ color: 'var(--text-2)', fontWeight: 500 }}>{incidents.length} incidents live</span>
          </div>
        </div>

        {/* Loading overlay */}
        {loading && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(var(--bg),0.7)', backdropFilter: 'blur(4px)' }}>
            <div className="card" style={{ padding: '24px 32px', textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>🌸</div>
              <p style={{ color: 'var(--text-2)', fontSize: 13 }}>Loading safety data...</p>
            </div>
          </div>
        )}

        <div style={{ height: '100%', borderRadius: 'var(--r-lg)', overflow: 'hidden' }}>
          <SafetyMap
            heatmapPoints={heatmapPoints}
            incidents={filteredIncidents}
            hotspots={hotspots}
            route={route}
            center={mapCenter}
            zoom={13}
          />
        </div>
      </div>

      {/* ── Side Panel ── */}
      <div style={{
        width: 340, height: '100dvh', background: 'var(--sidebar-bg)',
        borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column',
        overflowY: 'auto', flexShrink: 0
      }}>
        {/* Header */}
        <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontFamily: 'var(--heading-font)', fontSize: 20, color: 'var(--text)', marginBottom: 4 }}>Safety Tools</h2>
          <p style={{ fontSize: 12, color: 'var(--text-3)' }}>AI-powered location intelligence</p>
        </div>

        {/* Tabs */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', background: 'var(--surface)', borderRadius: 'var(--r-md)', padding: 4, gap: 2 }}>
            {TABS.map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                style={{
                  flex: 1, padding: '8px 4px', borderRadius: 'calc(var(--r-md) - 2px)',
                  border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                  background: tab === key ? 'var(--card)' : 'transparent',
                  color: tab === key ? 'var(--primary)' : 'var(--text-3)',
                  boxShadow: tab === key ? 'var(--shadow-xs)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                <span style={{ fontSize: 14 }}>{icon}</span> {label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* ── Risk Score ── */}
          {tab === 'check' && (
            <>
              <div className="card" style={{ padding: 18 }}>
                <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 14, lineHeight: 1.5 }}>
                  Enter an address or coordinates to get an AI risk assessment.
                </p>
                <div style={{ marginBottom: 10 }}>
                  <label className="label">Search by Address</label>
                  <input
                    value={riskAddr} onChange={e => { setRiskAddr(e.target.value); setRiskLat(''); setRiskLng('') }}
                    onKeyDown={e => e.key === 'Enter' && handleRisk()}
                    placeholder="e.g. Koramangala, Bangalore"
                    className="input-field"
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '10px 0', color: 'var(--text-3)', fontSize: 11 }}>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />or<div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                  <div>
                    <label className="label">Latitude</label>
                    <input value={riskLat} onChange={e => { setRiskLat(e.target.value); setRiskAddr('') }} placeholder="12.9716" className="input-field" style={{ fontSize: 13 }} />
                  </div>
                  <div>
                    <label className="label">Longitude</label>
                    <input value={riskLng} onChange={e => { setRiskLng(e.target.value); setRiskAddr('') }} placeholder="77.5946" className="input-field" style={{ fontSize: 13 }} />
                  </div>
                </div>
                <button
                  onClick={() => getMyLoc((lat, lng) => { setRiskLat(lat); setRiskLng(lng); setRiskAddr('') })}
                  style={{
                    width: '100%', padding: '9px', borderRadius: 'var(--r-md)',
                    background: 'transparent', border: '1.5px dashed var(--border)',
                    color: 'var(--text-2)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 10,
                    transition: 'all 0.2s'
                  }}
                >
                  📍 Use My Current Location
                </button>
                {riskErr && <p style={{ fontSize: 12, color: 'var(--danger)', marginBottom: 8 }}>⚠ {riskErr}</p>}
                <button className="btn-primary" onClick={handleRisk} disabled={riskLoading} style={{ width: '100%', justifyContent: 'center' }}>
                  {riskLoading ? <><Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} /> Analyzing...</> : '🔍 Check Risk Score'}
                </button>
              </div>

              {riskResult && (
                <div className="card" style={{ padding: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <span style={{ fontFamily: 'var(--heading-font)', fontSize: 15, color: 'var(--text)', fontWeight: 600 }}>Risk Assessment</span>
                    <RiskBadge zone={riskResult.zone} />
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-2)', marginBottom: 6 }}>
                      <span>Risk Level</span><span style={{ fontWeight: 700, color: 'var(--text)' }}>{(riskResult.score * 100).toFixed(1)}%</span>
                    </div>
                    <div style={{ height: 8, background: 'var(--surface)', borderRadius: 'var(--r-pill)', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 'var(--r-pill)', transition: 'width 0.5s',
                        width: `${riskResult.score * 100}%`,
                        background: riskResult.zone === 'red' ? 'var(--danger)' : riskResult.zone === 'yellow' ? 'var(--warning)' : 'var(--safe)'
                      }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-2)', marginBottom: 10 }}>
                    <span>Nearby incidents</span><span style={{ fontWeight: 600, color: 'var(--text)' }}>{riskResult.nearby_incidents}</span>
                  </div>
                  <div style={{ background: 'var(--surface)', borderRadius: 'var(--r-sm)', padding: '10px 12px', fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>
                    💡 {riskResult.message}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── Safe Route ── */}
          {tab === 'route' && (
            <>
              <div className="card" style={{ padding: 18 }}>
                <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 14, lineHeight: 1.5 }}>
                  Route is calculated to avoid high-risk areas. Enter any addresses.
                </p>
                <div style={{ marginBottom: 10 }}>
                  <label className="label">🌿 Origin</label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input value={origin} onChange={e => setOrigin(e.target.value)} placeholder="e.g. MG Road, Bangalore" className="input-field" style={{ flex: 1 }} />
                    <button
                      onClick={() => navigator.geolocation?.getCurrentPosition(p => setOrigin(`${p.coords.latitude.toFixed(4)}, ${p.coords.longitude.toFixed(4)}`))}
                      title="Use my location"
                      style={{ padding: '0 12px', background: 'var(--primary-subtle)', border: '1.5px solid var(--border)', borderRadius: 'var(--r-md)', cursor: 'pointer', fontSize: 14, flexShrink: 0 }}
                    >📍</button>
                  </div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label className="label">🔮 Destination</label>
                  <input value={dest} onChange={e => setDest(e.target.value)} placeholder="e.g. Indiranagar, Bangalore" className="input-field" />
                </div>
                {routeErr && <p style={{ fontSize: 12, color: 'var(--danger)', marginBottom: 8 }}>⚠ {routeErr}</p>}
                <button className="btn-primary" onClick={handleRoute} disabled={routeLoading || !origin || !dest} style={{ width: '100%', justifyContent: 'center' }}>
                  {routeLoading ? <><Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} /> Calculating...</> : '🗺️ Find Safest Route'}
                </button>
              </div>

              {routeResult && (
                <div className="card" style={{ padding: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <span style={{ fontFamily: 'var(--heading-font)', fontSize: 15, color: 'var(--text)' }}>Safe Route Found</span>
                    <button onClick={() => { setRoute(null); setRouteResult(null) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: 16 }}>✕</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                    {[
                      { label: 'Distance', value: `${routeResult.distance_km} km`, color: 'var(--text)' },
                      { label: 'Est. Time', value: `${routeResult.estimated_time_min} min`, color: 'var(--text)' },
                      { label: 'Safety', value: `${(routeResult.safety_score * 100).toFixed(0)}%`, color: 'var(--safe)' },
                      { label: 'Zones Avoided', value: routeResult.avoided_zones, color: 'var(--warning)' },
                    ].map((m, i) => (
                      <div key={i} style={{ background: 'var(--surface)', borderRadius: 'var(--r-md)', padding: '10px 12px', textAlign: 'center' }}>
                        <div style={{ fontSize: 16, fontWeight: 700, color: m.color }}>{m.value}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 500, marginTop: 2 }}>{m.label}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: 'var(--safe-subtle)', borderRadius: 'var(--r-sm)', padding: '8px 12px', fontSize: 12, color: 'var(--safe)', fontWeight: 600 }}>
                    ✓ Route shown on map · {routeResult.avoided_zones} danger zone(s) avoided
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── Alerts ── */}
          {tab === 'alerts' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ fontSize: 12, color: 'var(--text-3)' }}>Incidents within 5km of you</p>
                <button onClick={loadAlerts} style={{ fontSize: 11, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>↺ Refresh</button>
              </div>
              {alertsLoading && <div style={{ textAlign: 'center', padding: 32 }}><Loader2 style={{ width: 28, height: 28, color: 'var(--primary)', animation: 'spin 1s linear infinite' }} /></div>}
              {!alertsLoading && alerts.length === 0 && (
                <div className="card" style={{ padding: 24, textAlign: 'center' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🌸</div>
                  <p style={{ color: 'var(--safe)', fontWeight: 600, fontSize: 14, marginBottom: 4 }}>No alerts nearby!</p>
                  <p style={{ color: 'var(--text-3)', fontSize: 12 }}>Your area looks safe right now.</p>
                </div>
              )}
              {alerts.map((a, i) => (
                <div key={i} className="card" style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 16 }}>{a.zone === 'red' ? '⚠️' : a.zone === 'yellow' ? '⚡' : '✅'}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', textTransform: 'capitalize' }}>
                        {a.incident_type?.replace('_', ' ')}
                      </span>
                    </div>
                    <RiskBadge zone={a.zone} />
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5, marginBottom: 4 }}>
                    {a.address || a.ai_summary}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-3)' }}>Severity {a.severity}/10 · {timeAgo(a.created_at)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Legend */}
        <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>Map Legend</p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {[['var(--safe)', 'Safe'], ['var(--warning)', 'Caution'], ['var(--danger)', 'Danger']].map(([c, l]) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-2)' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />{l}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
