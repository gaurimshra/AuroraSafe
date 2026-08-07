'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2, ArrowBigUp, ArrowBigDown, ExternalLink, ShieldAlert, BadgeCheck, Clock, MapPin, Newspaper, UserCircle } from 'lucide-react'
import { getIncidents, voteIncident } from '@/lib/api'
import RiskBadge from '@/components/RiskBadge'

export default function CommunityPage() {
  const [incidents, setIncidents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [voted, setVoted] = useState<Record<string, 'up' | 'down'>>({})

  const loadFeed = async () => {
    try {
      setLoading(true)
      // Fetch 50 most recent incidents (both user reports and news scrape)
      const data = await getIncidents({ limit: 50 })
      setIncidents(data)
    } catch (err) {
      console.error('Failed to load feed:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFeed()
  }, [])

  const handleVote = async (id: string, voteType: 'up' | 'down') => {
    if (voted[id]) return // Prevent multi-voting logically
    try {
      // Optimistic update
      setIncidents(prev => prev.map(inc => {
        if (inc.id === id) {
          return {
            ...inc,
            upvotes: voteType === 'up' ? inc.upvotes + 1 : inc.upvotes,
            downvotes: voteType === 'down' ? inc.downvotes + 1 : inc.downvotes
          }
        }
        return inc
      }))
      setVoted(prev => ({ ...prev, [id]: voteType }))
      await voteIncident(id, voteType)
    } catch (err) {
      console.error('Vote failed:', err)
      // Revert optimistic on fail
      loadFeed()
    }
  }

  const timeAgo = (dateStr: string) => {
    const minDiff = Math.round((new Date().getTime() - new Date(dateStr).getTime()) / 60000)
    if (minDiff < 60) return `${minDiff} min ago`
    const hrDiff = Math.floor(minDiff / 60)
    if (hrDiff < 24) return `${hrDiff} hr ago`
    return `${Math.floor(hrDiff / 24)} days ago`
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold flex items-center gap-3">
            Community Safety Feed
          </h1>
          <p className="text-text-secondary mt-2">
            Real-time updates from community reports and AI-verified incident news.
          </p>
        </div>
        <button
          onClick={loadFeed}
          className="mt-4 md:mt-0 px-4 py-2 bg-surface border border-border rounded-lg hover:border-primary transition-colors text-sm font-semibold"
        >
          Refresh Feed
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-20">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      ) : incidents.length === 0 ? (
        <div className="text-center p-20 glass-card">
          <ShieldAlert className="w-16 h-16 mx-auto mb-4 text-text-3 opacity-50" />
          <h3 className="text-xl font-bold mb-2">No Incidents Found</h3>
          <p className="text-text-secondary">The feed is currently quiet and safe.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {incidents.map((incident, i) => (
            <motion.div
              key={incident.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card overflow-hidden flex flex-col md:flex-row border border-border hover:border-primary/50 transition-colors"
            >
              {/* Voting Side */}
              <div className="bg-surface/50 p-4 flex md:flex-col items-center justify-center gap-2 border-b md:border-b-0 md:border-r border-border min-w-[80px]">
                <button 
                  onClick={() => handleVote(incident.id, 'up')}
                  disabled={!!voted[incident.id]}
                  className={`p-1 rounded hover:bg-safe/20 transition-colors ${voted[incident.id] === 'up' ? 'text-safe' : 'text-text-secondary hover:text-text'}`}
                >
                  <ArrowBigUp className="w-6 h-6" />
                </button>
                <div className="font-bold text-lg min-w-[30px] text-center">
                  {incident.upvotes - incident.downvotes}
                </div>
                <button 
                  onClick={() => handleVote(incident.id, 'down')}
                  disabled={!!voted[incident.id]}
                  className={`p-1 rounded hover:bg-danger/20 transition-colors ${voted[incident.id] === 'down' ? 'text-danger' : 'text-text-secondary hover:text-text'}`}
                >
                  <ArrowBigDown className="w-6 h-6" />
                </button>
              </div>

              {/* Main Content Side */}
              <div className="p-5 flex-1">
                {/* Meta Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    {incident.source.includes('news') ? (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-safe bg-safe/10 px-2.5 py-1 rounded-full border border-safe/20">
                        <Newspaper className="w-3.5 h-3.5" /> AI Verified News
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
                        <UserCircle className="w-3.5 h-3.5" /> Community Report
                      </span>
                    )}
                    <span className="text-xs text-text-secondary flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {timeAgo(incident.created_at)}
                    </span>
                  </div>
                  <RiskBadge zone={incident.zone} />
                </div>

                {/* Content */}
                <h3 className="text-lg font-bold mb-2">
                  {incident.ai_summary || incident.incident_type.replace('_', ' ').toUpperCase()}
                </h3>
                <p className="text-text-secondary text-sm mb-4 line-clamp-2">
                  {incident.description}
                </p>

                {/* Footer details */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/50">
                  <div className="flex items-center gap-2 text-xs text-text-3">
                    <MapPin className="w-3.5 h-3.5 text-text" />
                    {incident.address || `${incident.latitude.toFixed(4)}, ${incident.longitude.toFixed(4)}`}
                  </div>
                  
                  {incident.news_url && (
                    <a 
                      href={incident.news_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:text-text flex items-center gap-1 font-semibold transition-colors"
                    >
                      Source Article <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
