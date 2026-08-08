import Link from 'next/link'
import { getIncidentImage } from '@/lib/incidentImagery'
import RiskBadge from '@/components/RiskBadge'
import { Clock } from 'lucide-react'

export default function IncidentCard({ incident }: { incident: any }) {
  const timeAgo = (dateStr: string) => {
    const minDiff = Math.round((new Date().getTime() - new Date(dateStr).getTime()) / 60000)
    if (minDiff < 60) return `${minDiff} min ago`
    const hrDiff = Math.floor(minDiff / 60)
    if (hrDiff < 24) return `${hrDiff} hr ago`
    return `${Math.floor(hrDiff / 24)} days ago`
  }

  return (
    <Link href={`/incidents/${incident.id}`} className="block">
      <div className="glass-card border border-border hover:border-primary/50 transition-colors overflow-hidden flex h-24">
        <div className="relative w-24 h-full shrink-0">
          <img src={getIncidentImage(incident.incident_type)} alt="Incident type" className="w-full h-full object-cover opacity-80" />
          <div className="absolute bottom-1 left-1 bg-black/60 backdrop-blur-sm px-1 py-0.5 rounded text-[8px] font-medium text-white/90 border border-white/10">
            Illustrative image
          </div>
        </div>
        <div className="p-3 flex flex-col justify-between flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2">
            <div className="text-sm font-medium text-text line-clamp-2">
              {incident.ai_summary || incident.description}
            </div>
            <div className="shrink-0 mt-0.5"><RiskBadge zone={incident.zone} /></div>
          </div>
          <div className="flex items-center text-xs text-text-secondary mt-1">
            <Clock className="w-3 h-3 mr-1" />
            {timeAgo(incident.created_at)}
          </div>
        </div>
      </div>
    </Link>
  )
}
