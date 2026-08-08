'use client'
import { useEffect, useState } from 'react'
import { getIncidentById, voteIncident } from '@/lib/api'
import { ArrowBigUp, ArrowBigDown, Loader2, MapPin, Clock, Info, ShieldCheck, AlertTriangle } from 'lucide-react'
import RiskBadge from '@/components/RiskBadge'
import { getIncidentImage } from '@/lib/incidentImagery'
import dynamic from 'next/dynamic'

const MapSelector = dynamic(() => import('@/components/SafetyMap'), {
  ssr: false,
  loading: () => <div className="h-[280px] w-full bg-surface animate-pulse rounded-xl" />
})

export default function IncidentDetailPage({ params }: { params: { id: string } }) {
  const [incident, setIncident] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [voted, setVoted] = useState<'up' | 'down' | null>(null)

  useEffect(() => {
    getIncidentById(params.id)
      .then(setIncident)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [params.id])

  const handleVote = async (voteType: 'up' | 'down') => {
    if (voted) return
    try {
      setIncident((prev: any) => ({
        ...prev,
        upvotes: voteType === 'up' ? prev.upvotes + 1 : prev.upvotes,
        downvotes: voteType === 'down' ? prev.downvotes + 1 : prev.downvotes
      }))
      setVoted(voteType)
      await voteIncident(params.id, voteType)
    } catch (err) {
      console.error('Vote failed:', err)
      // Revert optimistic on fail
      getIncidentById(params.id).then(setIncident)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-12 flex justify-center items-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!incident) {
    return (
      <div className="min-h-screen pt-24 pb-12 flex justify-center items-center">
        <div className="text-text-secondary">Incident not found</div>
      </div>
    )
  }

  const timeStr = new Date(incident.created_at).toLocaleString()

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-6">
      <div className="glass-card overflow-hidden">
        <div className="relative h-64 bg-card">
          <img src={getIncidentImage(incident.incident_type)} alt={incident.incident_type} className="w-full h-full object-cover opacity-80" />
          <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-md text-xs font-medium text-white/90 border border-white/10">
            Illustrative image
          </div>
          <div className="absolute bottom-4 left-4 right-4">
            <h1 className="text-2xl font-bold text-white drop-shadow-md">
              {incident.ai_summary || 'Reported Incident'}
            </h1>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-surface p-4 rounded-xl border border-border">
              <div className="text-xs text-text-secondary mb-2">Type</div>
              <div className="font-bold text-primary capitalize">{incident.incident_type?.replace('_', ' ') || '—'}</div>
            </div>
            <div className="bg-surface p-4 rounded-xl border border-border">
              <div className="text-xs text-text-secondary mb-2">Severity</div>
              <div className="flex items-end space-x-1">
                <span className={`font-bold text-2xl ${incident.severity >= 7 ? 'text-danger' : incident.severity >= 4 ? 'text-warning' : 'text-safe'}`}>
                  {incident.severity}
                </span>
                <span className="text-xs text-text-secondary mb-1">/10</span>
              </div>
            </div>
            <div className="bg-surface p-4 rounded-xl border border-border">
              <div className="text-xs text-text-secondary mb-2">Zone</div>
              <RiskBadge zone={incident.zone || 'yellow'} />
            </div>
            <div className="bg-surface p-4 rounded-xl border border-border">
              <div className="text-xs text-text-secondary mb-2">Source</div>
              <div className="font-medium text-text capitalize flex items-center gap-1.5">
                {incident.source === 'user_report' ? <ShieldCheck className="w-4 h-4 text-primary" /> : <Info className="w-4 h-4 text-accent" />}
                {incident.source?.replace('_', ' ') || 'User Report'}
              </div>
            </div>
          </div>

          <div className="space-y-4 mb-8">
            <div>
              <h3 className="text-sm font-medium text-text-secondary mb-1">Full Description</h3>
              <p className="text-text leading-relaxed bg-surface p-4 rounded-lg border border-border">{incident.description}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="space-y-4">
              <div className="flex items-start gap-3 text-sm text-text">
                <MapPin className="w-5 h-5 text-primary shrink-0" />
                <span>{incident.address || `${incident.latitude.toFixed(5)}, ${incident.longitude.toFixed(5)}`}</span>
              </div>
              <div className="flex items-start gap-3 text-sm text-text">
                <Clock className="w-5 h-5 text-primary shrink-0" />
                <span>{timeStr}</span>
              </div>
              
              <div className="pt-4 border-t border-border mt-4">
                <div className="text-sm font-medium text-text-secondary mb-3">Community Verification</div>
                <div className="flex gap-4">
                  <button
                    onClick={() => handleVote('up')}
                    disabled={voted !== null}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg border ${voted === 'up' ? 'bg-primary/20 border-primary text-primary' : 'border-border text-text hover:bg-surface disabled:opacity-50'}`}
                  >
                    <ArrowBigUp className={`w-5 h-5 ${voted === 'up' ? 'fill-current' : ''}`} />
                    <span className="font-bold">{incident.upvotes}</span>
                  </button>
                  <button
                    onClick={() => handleVote('down')}
                    disabled={voted !== null}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg border ${voted === 'down' ? 'bg-danger/20 border-danger text-danger' : 'border-border text-text hover:bg-surface disabled:opacity-50'}`}
                  >
                    <ArrowBigDown className={`w-5 h-5 ${voted === 'down' ? 'fill-current' : ''}`} />
                    <span className="font-bold">{incident.downvotes}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="h-[280px] rounded-xl overflow-hidden border border-border z-0 relative">
              <MapSelector
                center={[incident.latitude, incident.longitude]}
                zoom={15}
                incidents={[incident]}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
