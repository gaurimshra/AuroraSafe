'use client'
import { useState, useRef } from 'react'
import { ShieldCheck, MapPin, Send, Loader2, AlertTriangle, LocateFixed, RefreshCw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
import RiskBadge from '@/components/RiskBadge'
import { createIncident } from '@/lib/api'
import { reverseGeocode } from '@/lib/geocode'

const MapSelector = dynamic(() => import('@/components/SafetyMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[280px] w-full bg-surface animate-pulse rounded-xl flex items-center justify-center">
      <Loader2 className="animate-spin text-primary w-8 h-8"/>
    </div>
  )
})

export default function ReportPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')
  const [coords, setCoords] = useState({ lat: 28.6139, lng: 77.2090 })
  const [address, setAddress] = useState('')
  const [description, setDescription] = useState('')
  const [locating, setLocating] = useState(false)
  const descRef = useRef<HTMLTextAreaElement>(null)

  const useMyLocation = () => {
    if (!navigator.geolocation) { alert('Geolocation not supported'); return }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        setCoords({ lat, lng })
        // Reverse geocode
        const addr = await reverseGeocode(lat, lng)
        setAddress(addr.split(',').slice(0, 3).join(',').trim())
        setLocating(false)
      },
      () => {
        alert('Could not get location. Please allow location access.')
        setLocating(false)
      }
    )
  }

  const handleMapClick = async (e: any) => {
    const lat = e.latlng.lat
    const lng = e.latlng.lng
    setCoords({ lat, lng })
    const addr = await reverseGeocode(lat, lng)
    setAddress(addr.split(',').slice(0, 3).join(',').trim())
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!description.trim()) { setError('Please describe the incident.'); return }
    if (description.trim().length < 10) { setError('Description too short — provide more detail.'); return }
    setError('')
    setIsSubmitting(true)
    try {
      const data = await createIncident({
        latitude: coords.lat,
        longitude: coords.lng,
        description: description.trim(),
        address: address || undefined
      })
      setResult(data)
      setSubmitted(true)
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to submit. Make sure the backend is running.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setSubmitted(false); setResult(null); setDescription(''); setError('')
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold mb-4">Report an Incident</h1>
        <p className="text-text-secondary text-lg">Help keep the community safe. Gemini AI classifies your report instantly.</p>
      </div>

      <AnimatePresence mode="wait">
        {!submitted ? (
          <motion.form
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            onSubmit={handleSubmit}
            className="glass-card p-6 md:p-8 space-y-6"
          >
            {/* Map Picker */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-text-secondary">Incident Location</label>
                <button
                  type="button"
                  onClick={useMyLocation}
                  disabled={locating}
                  className="flex items-center space-x-1.5 text-xs text-primary hover:text-accent transition-colors disabled:opacity-50"
                >
                  {locating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LocateFixed className="w-3.5 h-3.5" />}
                  <span>{locating ? 'Getting location...' : 'Use My Location'}</span>
                </button>
              </div>
              <p className="text-xs text-text-muted">Click on the map to pin the exact location, or use your current location.</p>
              <div className="h-[280px] rounded-xl overflow-hidden border border-border relative z-0">
                <MapSelector
                  center={[coords.lat, coords.lng]}
                  zoom={14}
                  incidents={[{ lat: coords.lat, lng: coords.lng, zone: 'red', type: 'Reporting Here', summary: 'Click anywhere to move', severity: 5 }]}
                  onMapClick={handleMapClick}
                />
              </div>
              <div className="flex items-center space-x-2 text-sm text-text-secondary bg-surface p-3 rounded-lg border border-border">
                <MapPin className="w-4 h-4 text-primary shrink-0" />
                <span className="truncate">
                  {address || `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`}
                </span>
              </div>
            </div>

            {/* Address override */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-text-secondary">Address / Landmark <span className="text-text-muted">(optional override)</span></label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="e.g. Near Central Park entrance"
                className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-text-secondary">Description <span className="text-danger">*</span></label>
              <textarea
                ref={descRef}
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={5}
                required
                placeholder="Describe what you saw in detail — Gemini AI will analyze this to classify severity, type, and risk level."
                className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-none"
              />
              <p className="text-xs text-text-muted">{description.length} characters — be specific for better AI classification</p>
            </div>

            {error && (
              <div className="flex items-center space-x-2 bg-danger/10 border border-danger/30 rounded-lg px-4 py-3 text-danger text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-primary to-accent text-white py-4 rounded-xl font-bold text-lg hover:opacity-90 transition-opacity flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <><Loader2 className="w-6 h-6 animate-spin" /><span>Gemini AI is analyzing...</span></>
              ) : (
                <><Send className="w-5 h-5" /><span>Submit Report</span></>
              )}
            </button>
          </motion.form>
        ) : (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-8 space-y-6"
          >
            <div className="text-center">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${result?.zone === 'red' ? 'bg-danger/20' : result?.zone === 'yellow' ? 'bg-warning/20' : 'bg-safe/20'}`}>
                {result?.zone === 'red' ? <AlertTriangle className="w-10 h-10 text-danger" /> : <ShieldCheck className="w-10 h-10 text-safe" />}
              </div>
              <h2 className="text-3xl font-bold text-white">Report Submitted!</h2>
              <p className="text-text-secondary mt-2">Gemini AI has analyzed and classified your report.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface p-4 rounded-xl border border-border">
                <div className="text-xs text-text-secondary mb-2">Incident Type</div>
                <div className="font-bold text-primary capitalize">{result?.incident_type?.replace('_', ' ') || '—'}</div>
              </div>
              <div className="bg-surface p-4 rounded-xl border border-border">
                <div className="text-xs text-text-secondary mb-2">Severity</div>
                <div className="flex items-end space-x-1">
                  <span className={`font-bold text-2xl ${result?.severity >= 7 ? 'text-danger' : result?.severity >= 4 ? 'text-warning' : 'text-safe'}`}>{result?.severity}</span>
                  <span className="text-xs text-text-secondary mb-1">/10</span>
                </div>
              </div>
              <div className="bg-surface p-4 rounded-xl border border-border">
                <div className="text-xs text-text-secondary mb-2">Zone Classification</div>
                <RiskBadge zone={result?.zone || 'yellow'} />
              </div>
              <div className="bg-surface p-4 rounded-xl border border-border">
                <div className="text-xs text-text-secondary mb-2">AI Confidence</div>
                <div className="font-bold text-white">{result?.confidence ? `${(result.confidence * 100).toFixed(0)}%` : '—'}</div>
              </div>
              <div className="bg-surface p-4 rounded-xl border border-border col-span-2">
                <div className="text-xs text-text-secondary mb-2">AI Summary</div>
                <p className="text-sm text-gray-300">{result?.ai_summary || '—'}</p>
              </div>
              <div className="bg-surface p-4 rounded-xl border border-border col-span-2">
                <div className="text-xs text-text-secondary mb-2">Threat Category</div>
                <div className="font-medium capitalize text-white">{result?.threat_category?.replace('_', ' ') || '—'}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => window.location.href = '/map'}
                className="w-full bg-gradient-to-r from-primary to-accent text-white py-3 rounded-xl font-bold text-sm hover:opacity-90"
              >
                View on Map
              </button>
              <button
                onClick={resetForm}
                className="w-full bg-surface border border-border text-white py-3 rounded-xl font-bold text-sm hover:bg-card flex items-center justify-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Report Another</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
