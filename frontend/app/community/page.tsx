'use client'
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUser, SignInButton, Show } from '@clerk/nextjs'
import { ThumbsUp, ThumbsDown, MapPin, Clock, Shield, AlertTriangle, ShieldCheck, MessageSquare, Filter, RefreshCw, Loader2, TrendingUp } from 'lucide-react'
import { getIncidents, api } from '@/lib/api'
import Link from 'next/link'

const INCIDENT_TYPE_LABELS: Record<string, string> = {
  theft: '🎒 Theft',
  assault: '⚠️ Assault',
  harassment: '😡 Harassment',
  suspicious_activity: '👀 Suspicious',
  vandalism: '🔨 Vandalism',
  accident: '💥 Accident',
  sos_emergency: '🆘 SOS Emergency',
  other: '📋 Other',
}

const ZONE_STYLE: Record<string, { bg: string; text: string; border: string; label: string }> = {
  red: { bg: 'bg-danger/10', text: 'text-danger', border: 'border-danger/30', label: 'High Risk' },
  yellow: { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/30', label: 'Caution' },
  green: { bg: 'bg-safe/10', text: 'text-safe', border: 'border-safe/30', label: 'Safe Zone' },
}

const SOURCE_BADGE: Record<string, { label: string; color: string; stars: string }> = {
  newsapi: { label: 'AI News', color: 'text-primary', stars: '★★★★☆' },
  gnews: { label: 'AI News', color: 'text-primary', stars: '★★★★☆' },
  sos: { label: 'Emergency', color: 'text-danger', stars: '★★★★★' },
  seed_data: { label: 'Historical', color: 'text-text-secondary', stars: '★★☆☆☆' },
  user_report: { label: 'Community', color: 'text-warning', stars: '★★★☆☆' },
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function CommunityPage() {
  const { user, isSignedIn } = useUser()
  const [incidents, setIncidents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'red' | 'yellow' | 'green'>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set())
  const [stats, setStats] = useState({ total: 0, red: 0, verified: 0, community: 0 })

  const loadIncidents = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getIncidents({ limit: 200 })
      const sorted = [...data].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      setIncidents(sorted)
      setStats({
        total: sorted.length,
        red: sorted.filter((i: any) => i.zone === 'red').length,
        verified: sorted.filter((i: any) => i.status === 'verified').length,
        community: sorted.filter((i: any) => i.source === 'user_report').length,
      })
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadIncidents() }, [loadIncidents])

  const voteIncident = async (id: string, vote: 'up' | 'down') => {
    if (!isSignedIn) return
    if (votedIds.has(id)) return
    try {
      await api.put(`/incidents/${id}/vote`, { vote })
      setVotedIds(prev => new Set([...prev, id]))
      setIncidents(prev => prev.map(i =>
        i.id === id
          ? { ...i, upvotes: vote === 'up' ? i.upvotes + 1 : i.upvotes, downvotes: vote === 'down' ? i.downvotes + 1 : i.downvotes }
          : i
      ))
    } catch {}
  }

  const filtered = incidents.filter(i => {
    if (filter !== 'all' && i.zone !== filter) return false
    if (typeFilter !== 'all' && i.incident_type !== typeFilter) return false
    if (sourceFilter !== 'all' && i.source !== sourceFilter) return false
    return true
  })

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-extrabold">Community Safety Feed</h1>
          <button onClick={loadIncidents} className="p-2 text-text-secondary hover:text-white border border-border rounded-lg hover:border-primary transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <p className="text-text-secondary">Real-time incident reports from the AuroraSafe community across Delhi NCR</p>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Reports', value: stats.total, icon: MessageSquare, color: 'text-primary' },
          { label: 'High Risk', value: stats.red, icon: AlertTriangle, color: 'text-danger' },
          { label: 'Verified', value: stats.verified, icon: ShieldCheck, color: 'text-safe' },
          { label: 'Community Reports', value: stats.community, icon: TrendingUp, color: 'text-warning' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="glass-card p-4 flex items-center gap-3">
            <s.icon className={`w-5 h-5 ${s.color} shrink-0`} />
            <div>
              <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-text-secondary">{s.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="glass-card p-4 mb-6 flex flex-wrap gap-3 items-center">
        <Filter className="w-4 h-4 text-text-secondary shrink-0" />
        <div className="flex gap-2 flex-wrap">
          {(['all', 'red', 'yellow', 'green'] as const).map(z => (
            <button key={z} onClick={() => setFilter(z)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                filter === z ? 'bg-primary text-white' : 'bg-surface text-text-secondary hover:text-white border border-border'
              }`}>
              {z === 'all' ? 'All Zones' : z === 'red' ? '🔴 High Risk' : z === 'yellow' ? '🟡 Caution' : '🟢 Safe Zone'}
            </button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap ml-auto">
          {['all', 'user_report', 'newsapi', 'gnews', 'sos', 'seed_data'].map(s => (
            <button key={s} onClick={() => setSourceFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                sourceFilter === s ? 'bg-accent text-white' : 'bg-surface text-text-secondary hover:text-white border border-border'
              }`}>
              {s === 'all' ? 'All Sources' : s === 'user_report' ? '👤 Community' : s === 'sos' ? '🆘 SOS' : s === 'seed_data' ? '🕰️ Historical' : '📰 AI News'}
            </button>
          ))}
        </div>
      </div>

      {/* Sign-in prompt for anonymous users */}
      <Show when="signed-out">
        <div className="mb-6 glass-card p-4 border border-primary/30 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white">Sign in to upvote reports & build community trust</p>
            <p className="text-xs text-text-secondary mt-0.5">Your votes help verify real incidents from fake ones</p>
          </div>
          <SignInButton mode="modal">
            <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium shrink-0 hover:opacity-90 transition-opacity">
              Sign In
            </button>
          </SignInButton>
        </div>
      </Show>

      {/* Report CTA */}
      <Show when="signed-in">
        <div className="mb-6 glass-card p-4 border border-safe/30 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white">👋 Hey {user?.firstName || 'there'}! See something suspicious?</p>
            <p className="text-xs text-text-secondary mt-0.5">Your report is AI-analyzed by Gemini and added to the live map instantly</p>
          </div>
          <Link href="/report" className="bg-safe/20 text-safe border border-safe/30 px-4 py-2 rounded-lg text-sm font-medium shrink-0 hover:bg-safe/30 transition-all">
            + Report Incident
          </Link>
        </div>
      </Show>

      {/* Feed */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-text-secondary">
          <Shield className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>No incidents match the selected filters.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((inc, idx) => {
            const zone = ZONE_STYLE[inc.zone] || ZONE_STYLE.green
            const src = SOURCE_BADGE[inc.source] || SOURCE_BADGE.user_report
            const typeLabel = INCIDENT_TYPE_LABELS[inc.incident_type] || INCIDENT_TYPE_LABELS.other
            const hasVoted = votedIds.has(inc.id)

            return (
              <motion.div
                key={inc.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.02 }}
                className={`glass-card p-5 border ${zone.border} hover:shadow-lg transition-all`}
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${zone.bg} ${zone.text} ${zone.border}`}>
                      {zone.label}
                    </span>
                    <span className="text-xs bg-surface border border-border px-2.5 py-1 rounded-full text-text-secondary">
                      {typeLabel}
                    </span>
                    <span className={`text-xs font-medium ${src.color}`}>
                      {src.label} {src.stars}
                    </span>
                    {inc.status === 'verified' && (
                      <span className="text-xs bg-safe/10 text-safe border border-safe/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> Verified
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-text-secondary shrink-0">
                    <Clock className="w-3 h-3" />
                    {timeAgo(inc.created_at)}
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-text mb-3 leading-relaxed">
                  {inc.ai_summary || inc.description}
                </p>

                {/* Location & Severity */}
                <div className="flex flex-wrap items-center gap-4 mb-4 text-xs text-text-secondary">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-primary" />
                    {inc.address || `${inc.latitude?.toFixed(4)}, ${inc.longitude?.toFixed(4)}`}
                  </div>
                  <div className="flex items-center gap-1">
                    <span>Severity:</span>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} className={`w-2 h-2 rounded-sm ${i < (inc.severity || 0) 
                          ? inc.severity >= 7 ? 'bg-danger' : inc.severity >= 4 ? 'bg-warning' : 'bg-safe'
                          : 'bg-surface border border-border'}`} />
                      ))}
                    </div>
                    <span className="font-medium text-white">{inc.severity}/10</span>
                  </div>
                  {inc.confidence && (
                    <div>AI Confidence: <span className="text-white font-medium">{Math.round(inc.confidence * 100)}%</span></div>
                  )}
                  {inc.news_url && (
                    <a href={inc.news_url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                      Read source →
                    </a>
                  )}
                </div>

                {/* Vote row */}
                <div className="flex items-center justify-between border-t border-border/50 pt-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => voteIncident(inc.id, 'up')}
                      disabled={hasVoted || !isSignedIn}
                      title={!isSignedIn ? 'Sign in to vote' : hasVoted ? 'Already voted' : 'Confirm this is real'}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        hasVoted ? 'bg-safe/20 text-safe cursor-default' :
                        !isSignedIn ? 'text-text-secondary cursor-not-allowed opacity-50' :
                        'bg-surface text-text-secondary hover:bg-safe/20 hover:text-safe border border-border hover:border-safe/50'
                      }`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      {inc.upvotes || 0} Confirm
                    </button>
                    <button
                      onClick={() => voteIncident(inc.id, 'down')}
                      disabled={hasVoted || !isSignedIn}
                      title={!isSignedIn ? 'Sign in to vote' : hasVoted ? 'Already voted' : 'Mark as false'}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        hasVoted ? 'bg-danger/20 text-danger cursor-default' :
                        !isSignedIn ? 'text-text-secondary cursor-not-allowed opacity-50' :
                        'bg-surface text-text-secondary hover:bg-danger/20 hover:text-danger border border-border hover:border-danger/50'
                      }`}
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                      {inc.downvotes || 0} Dispute
                    </button>
                  </div>
                  <Link
                    href={`/map?lat=${inc.latitude}&lng=${inc.longitude}`}
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    <MapPin className="w-3 h-3" /> View on Map
                  </Link>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
