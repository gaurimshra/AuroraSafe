'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { AlertTriangle, ShieldCheck, Clock, Activity, Loader2, RefreshCw, Sun, CloudRain, Newspaper, LifeBuoy, Users, History, ChevronRight, Info, ExternalLink } from 'lucide-react'
import dynamic from 'next/dynamic'

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts'
import RiskBadge from '@/components/RiskBadge'
import HighRiskZoneModal from '@/components/HighRiskZoneModal'
import IncidentCard from '@/components/IncidentCard'
import { getDashboardStats, getDashboardTrends, getDashboardCategories, getZones, getWeather, getNewsIncidents, getSOSHistory, getIncidents } from '@/lib/api'

const ZONE_COLORS: Record<string, string> = {
  theft: '#f59e0b',
  assault: '#ef4444',
  harassment: '#8b5cf6',
  suspicious_activity: '#06b6d4',
  vandalism: '#f97316',
  accident: '#22c55e',
  other: '#6b7280'
}

export default function DashboardPage() {
  const [isMounted, setIsMounted] = useState(false)
  const [stats, setStats] = useState<any>(null)
  const [trends, setTrends] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [zones, setZones] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [weather, setWeather] = useState<any>(null)
  const [newsIncidents, setNewsIncidents] = useState<any[]>([])
  const [sosHistory, setSosHistory] = useState<any[]>([])
  const [recentIncidents, setRecentIncidents] = useState<any[]>([])
  const [newsExpanded, setNewsExpanded] = useState(false)
  const [selectedZone, setSelectedZone] = useState<any[] | null>(null)

  const timeAgo = (dateStr: string) => {
    if (!dateStr) return 'Unknown'
    const minDiff = Math.round((new Date().getTime() - new Date(dateStr).getTime()) / 60000)
    if (minDiff < 60) return `${minDiff} min ago`
    const hrDiff = Math.floor(minDiff / 60)
    if (hrDiff < 24) return `${hrDiff} hr ago`
    return `${Math.floor(hrDiff / 24)} days ago`
  }

  const customTooltipStyle = {
    backgroundColor: '#111128',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: '#f1f5f9'
  }

  const loadData = async () => {
    try {
      const [statsData, trendsData, catData, zonesData, wData, newsData, sosData, recentData] = await Promise.all([
        getDashboardStats(),
        getDashboardTrends(),
        getDashboardCategories(),
        getZones(),
        getWeather('Delhi').catch(() => null),
        getNewsIncidents(6).catch(() => []),
        getSOSHistory().catch(() => []),
        getIncidents({ limit: 10 }).catch(() => [])
      ])
      setStats(statsData)
      if (wData) setWeather(wData)
      setNewsIncidents(newsData)
      setSosHistory(sosData)
      setRecentIncidents(recentData)
      // Format trends for chart (last 14 days, with day names)
      const formattedTrends = trendsData.slice(-14).map((t: any) => ({
        name: new Date(t.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        incidents: t.count,
        high_risk: t.high_risk
      }))
      setTrends(formattedTrends)
      setCategories(catData.map((c: any) => ({
        name: c.name.replace('_', ' '),
        value: c.count,
        pct: c.percentage
      })))
      setZones(zonesData.slice(0, 5))
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Dashboard data error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setIsMounted(true)
    loadData()
    const interval = setInterval(loadData, 60000)
    return () => clearInterval(interval)
  }, [])

  const StatCard = ({ label, value, icon: Icon, color, bg, onClick }: any) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className={`glass-card p-6 flex items-center space-x-4 ${onClick ? 'cursor-pointer hover:border-primary transition-colors border border-transparent' : ''}`}
    >
      <div className={`p-4 rounded-xl ${bg}`}>
        <Icon className={`w-7 h-7 ${color}`} />
      </div>
      <div>
        {loading ? (
          <div className="w-16 h-7 bg-surface animate-pulse rounded mb-1" />
        ) : (
          <div className="text-2xl font-bold text-text">{value}</div>
        )}
        <div className="text-sm text-text-secondary">{label}</div>
      </div>
    </motion.div>
  )

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-extrabold">Safety Analytics Dashboard</h1>
          <p className="text-text-secondary mt-1">Real-time intelligence from community reports.</p>
        </div>
        <div className="flex items-center space-x-4 mt-4 md:mt-0">
          <div className="text-sm text-text-secondary bg-card px-4 py-2 rounded-lg border border-border flex items-center">
            <span className="w-2 h-2 rounded-full bg-safe animate-pulse mr-2" />
            {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Loading...'}
          </div>
          <button
            onClick={loadData}
            className="p-2 rounded-lg border border-border text-text-secondary hover:text-white hover:border-primary transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weather Strip */}
      {weather && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 glass-card p-4 flex items-center justify-between border-l-4 border-primary">
          <div className="flex items-center gap-4">
            <span className="flex items-center justify-center text-3xl">{weather.safety_factor < 0.8 ? <CloudRain size={32} /> : <Sun size={32} />}</span>
            <div>
              <div className="font-bold text-text text-lg">{weather.city}: {weather.temp_celsius}°C {weather.condition}</div>
              <div className="text-sm text-text-secondary">Visibility: {(weather.visibility_m / 1000).toFixed(1)} km | Wind: {weather.wind_speed_mps} m/s</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-text-secondary mb-1">Weather Safety Factor</div>
            <div className={`font-bold text-xl ${weather.safety_factor < 0.8 ? 'text-danger' : 'text-safe'}`}>
              {(weather.safety_factor * 100).toFixed(0)}%
            </div>
          </div>
        </motion.div>
      )}

      {/* Data Source Breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="glass-card p-4 border border-border/50">
          <div className="flex justify-between items-start mb-1">
            <div className="text-xs text-text-secondary flex items-center gap-1.5"><Newspaper size={14} /> AI-Verified News</div>
            <button onClick={() => setNewsExpanded(!newsExpanded)} className="text-xs text-primary hover:underline">{newsExpanded ? 'Collapse' : 'Expand'}</button>
          </div>
          <div className="text-xl font-bold text-primary">
            {(stats?.source_counts?.newsapi || 0) + (stats?.source_counts?.gnews || 0) + (stats?.source_counts?.fallback_news || 0)}
          </div>
          {newsExpanded && (
            <div className="mt-4 space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
              {newsIncidents.length === 0 ? <div className="text-xs text-text-secondary">No news incidents yet</div> : newsIncidents.map((inc, i) => (
                <div key={i} className="text-sm bg-surface p-2 rounded-lg border border-border/50">
                  <div className="flex justify-between mb-1">
                    <span className="text-[10px] font-bold text-primary uppercase bg-primary/10 px-1.5 py-0.5 rounded">{inc.source}</span>
                    <span className="text-[10px] text-text-secondary">{timeAgo(inc.created_at)}</span>
                  </div>
                  <div className="font-medium text-text-secondary line-clamp-2 leading-tight mb-1">{inc.ai_summary}</div>
                  <div className="flex justify-between items-center text-[10px] text-text-muted">
                    <span className="truncate flex-1 mr-2">{inc.address}</span>
                    {inc.news_url && <a href={inc.news_url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline flex items-center gap-1"><ExternalLink size={10} /> Link</a>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="glass-card p-4 border border-border/50 flex flex-col">
          <div className="text-xs text-text-secondary mb-1 flex items-center gap-1.5"><LifeBuoy size={14} /> Emergency Triggers</div>
          <div className="text-xl font-bold text-danger mb-3">
            {stats?.source_counts?.sos || 0}
          </div>
          <div className="flex-1 overflow-y-auto max-h-40 space-y-2 pr-2 custom-scrollbar">
            {sosHistory.length === 0 ? <div className="text-xs text-text-secondary">No recent triggers</div> : sosHistory.slice(0, 5).map((sos, i) => (
              <div key={i} className="text-xs bg-danger/10 border border-danger/20 p-2 rounded-lg">
                <div className="flex justify-between text-danger mb-1"><span className="font-bold">{timeAgo(sos.created_at)}</span><span>{sos.contact_count} contacts</span></div>
                <div className="text-text-secondary truncate">{sos.location_text}</div>
              </div>
            ))}
          </div>
        </div>
        <Link href="/community" className="glass-card p-4 border border-border/50 hover:border-primary transition-colors cursor-pointer group flex flex-col justify-between">
          <div>
            <div className="text-xs text-text-secondary mb-1 flex items-center gap-1.5"><Users size={14} /> Community Reports</div>
            <div className="text-xl font-bold text-warning">
              {stats?.source_counts?.user_report || 0}
            </div>
          </div>
          <div className="text-xs text-primary flex items-center mt-2 group-hover:translate-x-1 transition-transform">View feed <ChevronRight className="w-3 h-3 ml-1" /></div>
        </Link>
        <div className="glass-card p-4 border border-border/50">
          <div className="text-xs text-text-secondary mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1.5"><History size={14} /> Verified Incident Database (Archive)</span>
            <span title="Synthetic baseline data used to bootstrap the risk model and demonstrate clustering — not a live feed.">
              <Info size={14} className="text-text-muted cursor-help" />
            </span>
          </div>
          <div className="text-xl font-bold text-text-3">
            {stats?.source_counts?.seed_data || 0}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard label="Total Incidents" value={stats?.total_incidents ?? '—'} icon={Activity} color="text-primary" bg="bg-primary/20" />
        <StatCard label="High Risk Zones" value={stats?.high_risk_zones ?? '—'} icon={AlertTriangle} color="text-danger" bg="bg-danger/20" onClick={() => setSelectedZone(zones.filter((z: any) => z.risk_level === 'red'))} />
        <StatCard
          label="Verified Reports"
          value={stats ? `${Math.round((stats.verified_incidents / (stats.total_incidents || 1)) * 100)}%` : '—'}
          icon={ShieldCheck} color="text-safe" bg="bg-safe/20"
        />
        <StatCard label="Pending AI Review" value={stats?.pending_incidents ?? '—'} icon={Clock} color="text-warning" bg="bg-warning/20" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        {/* Area chart — trends */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-6 lg:col-span-2 flex flex-col">
          <h3 className="text-lg font-bold mb-6">Incidents Over Time (Last 14 Days)</h3>
          {(!isMounted || (trends.length === 0 && loading)) ? (
            <div className="h-[300px] flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : trends.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-text-secondary text-sm">No trend data available yet.</div>
          ) : (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends}>
                  <defs>
                    <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorHR" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.6}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} />
                  <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={customTooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="incidents" name="Total" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorInc)" />
                  <Area type="monotone" dataKey="high_risk" name="High Risk" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorHR)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="mt-8 border-t border-border/50 pt-6">
            <h3 className="text-md font-bold mb-4">Recent Incidents</h3>
            <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
              {recentIncidents.map(inc => (
                <div key={inc.id} className="w-72 shrink-0">
                  <IncidentCard incident={inc} />
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Pie chart — incident categories */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card p-6 lg:col-span-1">
          <h3 className="text-lg font-bold mb-6">Incident Categories</h3>
          {(!isMounted || (categories.length === 0 && loading)) ? (
            <div className="h-[300px] flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : categories.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-text-secondary text-sm">No data yet.</div>
          ) : (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categories} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, pct }) => `${pct}%`}>
                    {categories.map((c, i) => (
                      <Cell key={i} fill={ZONE_COLORS[c.name.replace(' ', '_')] || `hsl(${i * 60}, 70%, 55%)`} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={customTooltipStyle} formatter={(val: any, name: any, props: any) => [`${val} incidents`, props.payload.name]} />
                  <Legend wrapperStyle={{ fontSize: 12 }} formatter={(val) => val.replace('_', ' ')} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>
      </div>

      {/* Hotspots Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="glass-card overflow-hidden">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h3 className="text-lg font-bold">Active Hotspot Zones (AI-Detected)</h3>
          <span className="text-xs text-text-secondary bg-surface px-3 py-1 rounded-full border border-border">DBSCAN clustering</span>
        </div>
        {zones.length === 0 && loading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : zones.length === 0 ? (
          <div className="p-12 text-center text-text-secondary text-sm">No hotspots detected yet — need more incident data.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-surface/50 text-text-secondary text-sm">
                <tr>
                  <th className="px-6 py-4 font-medium">Center Coordinates</th>
                  <th className="px-6 py-4 font-medium">Risk Level</th>
                  <th className="px-6 py-4 font-medium">Incidents</th>
                  <th className="px-6 py-4 font-medium">Dominant Type</th>
                  <th className="px-6 py-4 font-medium">Radius</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {zones.map((zone, i) => (
                  <tr key={i} className="hover:bg-surface/30 transition-colors cursor-pointer" onClick={() => setSelectedZone([zone])}>
                    <td className="px-6 py-4 font-mono text-sm text-text">
                      {zone.lat.toFixed(4)}, {zone.lng.toFixed(4)}
                    </td>
                    <td className="px-6 py-4"><RiskBadge zone={zone.risk_level} /></td>
                    <td className="px-6 py-4 text-text font-bold">{zone.incident_count}</td>
                    <td className="px-6 py-4 text-text-secondary capitalize">{zone.dominant_type?.replace('_', ' ')}</td>
                    <td className="px-6 py-4 text-text-secondary">{zone.radius.toFixed(2)} km</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {selectedZone && <HighRiskZoneModal zones={selectedZone} onClose={() => setSelectedZone(null)} />}
    </div>
  )
}
