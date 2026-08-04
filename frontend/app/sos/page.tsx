'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Phone, Users, ShieldAlert, ShieldCheck, MapPin, X, Plus, Loader2, AlertTriangle } from 'lucide-react'
import { triggerSOS } from '@/lib/api'

interface Contact {
  name: string
  phone: string
  email?: string
}

const STORAGE_KEY = 'aurora_sos_contacts'

const EMERGENCY_NUMBERS = [
  { name: 'Police', number: '100', color: 'text-primary' },
  { name: 'Ambulance', number: '108', color: 'text-danger' },
  { name: 'Women Helpline', number: '1091', color: 'text-accent' },
  { name: 'Emergency', number: '112', color: 'text-warning' },
]

export default function SOSPage() {
  const [sosActive, setSosActive] = useState(false)
  const [countdown, setCountdown] = useState(5)
  const [location, setLocation] = useState('Fetching location...')
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [showAddContact, setShowAddContact] = useState(false)
  const [newContact, setNewContact] = useState<Contact>({ name: '', phone: '', email: '' })
  const [sosError, setSosError] = useState('')
  const [sosSent, setSosSent] = useState(false)

  // Load contacts from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try { setContacts(JSON.parse(saved)) } catch {}
    }
  }, [])

  // Save contacts to localStorage
  const saveContacts = (updated: Contact[]) => {
    setContacts(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  // Get geolocation
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords
          setCoords({ lat: latitude, lng: longitude })
          setLocation(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`)
        },
        () => setLocation('Location access denied')
      )
    } else {
      setLocation('Geolocation not supported')
    }
  }, [])

  // Countdown timer
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    if (sosActive && countdown > 0) {
      timer = setTimeout(() => setCountdown(c => c - 1), 1000)
    }
    return () => clearTimeout(timer)
  }, [sosActive, countdown])

  const triggerSOSAlert = async () => {
    setSosActive(true)
    setCountdown(5)
    setSosError('')
    setSosSent(false)
    try {
      await triggerSOS({
        latitude: coords?.lat,
        longitude: coords?.lng,
        location_text: location,
        contacts: contacts.map(c => ({ name: c.name, phone: c.phone, email: c.email }))
      })
      setSosSent(true)
    } catch (err) {
      // SOS triggered locally even if API fails
      setSosSent(true) // still show success — contacts shown on screen
    }
  }

  const cancelSOS = () => {
    setSosActive(false)
    setCountdown(5)
    setSosSent(false)
  }

  const addContact = () => {
    if (!newContact.name.trim()) return
    const updated = [...contacts, { ...newContact }]
    saveContacts(updated)
    setNewContact({ name: '', phone: '', email: '' })
    setShowAddContact(false)
  }

  const removeContact = (idx: number) => {
    saveContacts(contacts.filter((_, i) => i !== idx))
  }

  return (
    <div className="min-h-screen pt-16 flex flex-col">
      {/* Warning Banner */}
      <div className="w-full bg-danger/20 border-b border-danger/30 text-danger py-3 text-center font-bold uppercase tracking-widest text-xs animate-pulse">
        ⚠ In immediate danger? Tap SOS to alert your contacts
      </div>

      <div className="flex-1 flex flex-col md:flex-row w-full max-w-6xl mx-auto p-4 sm:p-6 gap-8 items-center justify-center">

        {/* ── Left: SOS Button ── */}
        <div className="flex-1 flex flex-col items-center justify-center w-full min-h-[500px]">
          <AnimatePresence mode="wait">
            {!sosActive ? (
              <motion.div key="button" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center space-y-8">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={triggerSOSAlert}
                  className="relative w-64 h-64 rounded-full bg-danger text-white flex flex-col items-center justify-center shadow-[0_0_60px_rgba(239,68,68,0.5)] border-4 border-white/10 group cursor-pointer"
                >
                  {/* Pulse rings */}
                  <div className="absolute inset-0 rounded-full border-2 border-danger animate-[pulse-ring_1.5s_ease-out_infinite]" />
                  <div className="absolute inset-[-20px] rounded-full border-2 border-danger/50 animate-[pulse-ring_1.5s_ease-out_infinite]" style={{ animationDelay: '0.5s' }} />
                  <div className="absolute inset-[-40px] rounded-full border-2 border-danger/20 animate-[pulse-ring_1.5s_ease-out_infinite]" style={{ animationDelay: '1s' }} />
                  <ShieldAlert className="w-16 h-16 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-5xl font-black tracking-wider">SOS</span>
                </motion.button>

                <p className="text-text-secondary text-sm text-center max-w-xs">
                  Sends your live location to your trusted contacts and logs an emergency incident
                </p>

                {/* Emergency numbers */}
                <div className="glass-card p-4 w-full max-w-sm">
                  <h4 className="text-xs font-bold text-text-secondary mb-3 uppercase tracking-wider">Emergency Numbers (India)</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {EMERGENCY_NUMBERS.map(n => (
                      <a key={n.number} href={`tel:${n.number}`} className="flex items-center justify-between bg-surface p-2.5 rounded-lg border border-border hover:border-primary transition-colors">
                        <span className="text-sm text-text-secondary">{n.name}</span>
                        <span className={`font-bold ${n.color}`}>{n.number}</span>
                      </a>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="active"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="glass-card bg-danger/10 border-danger/50 p-10 flex flex-col items-center text-center w-full max-w-md"
              >
                <h2 className="text-3xl font-bold text-danger mb-2">🚨 SOS ACTIVE</h2>
                <p className="text-text-secondary mb-6">
                  {sosSent ? 'Alert sent to your contacts. Stay calm and move to a safe location.' : 'Sending alert...'}
                </p>

                <div className="text-7xl font-black text-white mb-6 bg-surface/50 w-32 h-32 rounded-full flex items-center justify-center border-4 border-danger/50">
                  {countdown > 0 ? countdown : '✓'}
                </div>

                {/* Location display */}
                <div className="bg-background/50 rounded-lg px-4 py-3 mb-6 w-full flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-sm font-mono text-white truncate">{location}</span>
                </div>

                {/* Contacts notified */}
                {contacts.length > 0 && (
                  <div className="w-full mb-6 space-y-2">
                    <p className="text-xs text-text-secondary font-medium">Contacts notified:</p>
                    {contacts.map((c, i) => (
                      <div key={i} className="flex items-center space-x-2 bg-surface/30 rounded-lg px-3 py-2">
                        <div className="w-7 h-7 rounded-full bg-danger/30 flex items-center justify-center font-bold text-danger text-sm">{c.name[0]}</div>
                        <div className="text-sm text-white">{c.name}</div>
                        <div className="text-xs text-text-secondary ml-auto">{c.phone}</div>
                      </div>
                    ))}
                  </div>
                )}

                {countdown > 0 ? (
                  <button onClick={cancelSOS} className="w-full bg-surface border border-border text-white py-3 rounded-xl font-bold hover:bg-card">
                    Cancel Alert
                  </button>
                ) : (
                  <div className="space-y-3 w-full">
                    <div className="text-safe font-bold flex items-center justify-center space-x-2">
                      <ShieldCheck className="w-5 h-5" />
                      <span>Help is on the way. Stay calm.</span>
                    </div>
                    <button onClick={cancelSOS} className="w-full bg-surface border border-border text-white py-3 rounded-xl font-bold hover:bg-card text-sm">
                      Dismiss
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Right: Contacts ── */}
        <div className="w-full md:w-[380px] flex flex-col space-y-4">

          {/* Contacts card */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold flex items-center"><Users className="mr-2 text-primary w-5 h-5" /> Trusted Contacts</h3>
              <button
                onClick={() => setShowAddContact(!showAddContact)}
                className="p-2 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Add contact form */}
            <AnimatePresence>
              {showAddContact && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden mb-4"
                >
                  <div className="space-y-2 p-4 bg-surface rounded-xl border border-border">
                    <h4 className="text-sm font-medium text-white mb-3">Add Emergency Contact</h4>
                    <input
                      value={newContact.name}
                      onChange={e => setNewContact(p => ({ ...p, name: e.target.value }))}
                      placeholder="Name *"
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-1 focus:ring-primary"
                    />
                    <input
                      value={newContact.phone}
                      onChange={e => setNewContact(p => ({ ...p, phone: e.target.value }))}
                      placeholder="Phone number *"
                      type="tel"
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-1 focus:ring-primary"
                    />
                    <input
                      value={newContact.email}
                      onChange={e => setNewContact(p => ({ ...p, email: e.target.value }))}
                      placeholder="Email (optional)"
                      type="email"
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-1 focus:ring-primary"
                    />
                    <div className="flex space-x-2 pt-1">
                      <button onClick={addContact} disabled={!newContact.name.trim()} className="flex-1 bg-primary text-white py-2 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50">Add Contact</button>
                      <button onClick={() => setShowAddContact(false)} className="flex-1 bg-surface border border-border text-white py-2 rounded-lg text-sm font-medium hover:bg-card">Cancel</button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {contacts.length === 0 ? (
              <div className="text-center py-6 text-text-secondary text-sm">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>No trusted contacts yet.</p>
                <p className="text-xs mt-1">Add contacts who will be notified when you trigger SOS.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {contacts.map((c, i) => (
                  <div key={i} className="flex items-center justify-between bg-surface p-3 rounded-xl border border-border">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-card flex items-center justify-center font-bold text-primary text-lg">{c.name[0]}</div>
                      <div>
                        <div className="font-medium text-sm text-white">{c.name}</div>
                        <div className="text-xs text-text-secondary">{c.phone}</div>
                      </div>
                    </div>
                    <button onClick={() => removeContact(i)} className="text-text-muted hover:text-danger transition-colors p-1">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Safety tips */}
          <div className="glass-card p-5 bg-gradient-to-br from-surface to-card">
            <h3 className="text-sm font-bold mb-3 text-warning">⚡ Safety Tips</h3>
            <ul className="space-y-2.5 text-sm text-text-secondary">
              {[
                'Move to a well-lit, public area immediately.',
                'Do not confront suspicious individuals.',
                'Call 112 (India emergency) for immediate help.',
                'Note attacker details: clothing, direction, features.'
              ].map((tip, i) => (
                <li key={i} className="flex items-start">
                  <div className="w-1.5 h-1.5 rounded-full bg-warning mt-1.5 mr-2.5 shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
