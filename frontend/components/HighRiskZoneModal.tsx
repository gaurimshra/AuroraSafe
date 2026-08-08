import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MapPin, AlertTriangle, Building2, Loader2 } from 'lucide-react'
import { reverseGeocode } from '@/lib/geocode'
import { getNearbyPOIs } from '@/lib/api'
import { getIncidentImage } from '@/lib/incidentImagery'
import RiskBadge from '@/components/RiskBadge'

export default function HighRiskZoneModal({ zones, onClose }: { zones: any[], onClose: () => void }) {
  const [enrichedZones, setEnrichedZones] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const enrich = async () => {
      // Sort zones by risk (red first, then incident count)
      const sorted = [...zones].sort((a, b) => {
        if (a.risk_level === 'red' && b.risk_level !== 'red') return -1
        if (b.risk_level === 'red' && a.risk_level !== 'red') return 1
        return b.incident_count - a.incident_count
      }).slice(0, 10) // top 10

      const enriched = []
      for (const z of sorted) {
        if (!mounted) break
        try {
          const addr = await reverseGeocode(z.lat, z.lng)
          const poi = await getNearbyPOIs(z.lat, z.lng).catch(() => null)
          
          enriched.push({
            ...z,
            address: addr || 'Unknown Location',
            landmark: poi?.nearest_police_name || 'No named landmark found nearby'
          })
          setEnrichedZones([...enriched]) // progressive update
        } catch (e) {
          enriched.push({ ...z, address: 'Location details unavailable', landmark: 'No named landmark found nearby' })
          setEnrichedZones([...enriched])
        }
        // Small delay to respect Nominatim rate limits (approx 1 req/sec)
        await new Promise(r => setTimeout(r, 1100))
      }
      if (mounted) setLoading(false)
    }
    enrich()
    return () => { mounted = false }
  }, [zones])

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="relative w-full max-w-md h-full bg-surface border-l border-border shadow-2xl flex flex-col z-10"
        >
          <div className="p-6 border-b border-border flex items-center justify-between sticky top-0 bg-surface/95 backdrop-blur z-20">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <AlertTriangle className="text-danger" /> Zone Details
              </h2>
              <p className="text-sm text-text-secondary mt-1">Detailed analysis of active hotspots</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-card rounded-full transition-colors text-text-secondary hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {enrichedZones.map((z, i) => (
              <div key={i} className="glass-card overflow-hidden border border-border flex flex-col">
                <div className="relative h-48 bg-card">
                  <img src={getIncidentImage(z.dominant_type)} alt={z.dominant_type} className="w-full h-full object-cover opacity-80" />
                  <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium text-white/90 border border-white/10">
                    Illustrative image
                  </div>
                  <div className="absolute top-3 right-3">
                    <RiskBadge zone={z.risk_level} />
                  </div>
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <div className="font-bold text-lg capitalize text-white flex items-center gap-2">
                      {z.dominant_type.replace('_', ' ')} Hotspot
                    </div>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <p className="text-sm text-text-secondary font-medium">
                    {z.incident_count} incidents reported here, mostly {z.dominant_type.replace('_', ' ')}{z.avg_severity ? `, average severity ${z.avg_severity.toFixed(1)}/10` : ''}.
                  </p>
                  <div className="space-y-2 pt-3 border-t border-border/50">
                    <div className="flex items-start gap-2 text-sm text-text">
                      <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{z.address}</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm text-text">
                      <Building2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span>{z.landmark}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex items-center justify-center p-6 text-text-secondary gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span className="text-sm">Enriching zone data...</span>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
