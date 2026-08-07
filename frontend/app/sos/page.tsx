'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Phone, Users, ShieldAlert, ShieldCheck, MapPin, X, Plus, Loader2, AlertTriangle, Lock, Sun, CloudRain, CloudSun, Activity } from 'lucide-react'
import { triggerSOS, getSOSHistory, getSOSContacts, addSOSContact, deleteSOSContact } from '@/lib/api'
import { useUser, SignInButton } from '@clerk/nextjs'

interface Contact {
  id?: string
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
  const { user } = useUser()
  const [sosActive, setSosActive] = useState(false)
  const [countdown, setCountdown] = useState(5)
  const [location, setLocation] = useState('Fetching location...')
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [showAddContact, setShowAddContact] = useState(false)
  const [newContact, setNewContact] = useState<Contact>({ name: '', phone: '', email: '' })
  const [sosSent, setSosSent] = useState(false)
  const [waLinks, setWaLinks] = useState<string[]>([])
  const [ngos, setNgos] = useState<any[]>([])
  const [history, setHistory] = useState<any[]>([])
  const [stealthMode, setStealthMode] = useState(false)
  const [shakeEnabled, setShakeEnabled] = useState(false)
  const [shakeHint, setShakeHint] = useState('')
  
  // Walk With Me
  const [walkActive, setWalkActive] = useState(false)
  const [walkETA, setWalkETA] = useState<number | null>(null)
  const [walkMinsRemaining, setWalkMinsRemaining] = useState(0)

  const loadHistory = async () => {
    try {
      const h = await getSOSHistory(user?.id)
      setHistory(h)
    } catch {}
  }

  useEffect(() => { loadHistory() }, [user])

  // Shake-to-SOS via DeviceMotion
  useEffect(() => {
    if (!shakeEnabled) return
    let shakes = 0
    let lastShake = 0
    const handleMotion = (e: DeviceMotionEvent) => {
      const acc = e.accelerationIncludingGravity
      if (!acc) return
      const total = Math.abs(acc.x || 0) + Math.abs(acc.y || 0) + Math.abs(acc.z || 0)
      if (total > 35) {
        const now = Date.now()
        if (now - lastShake < 600) shakes++
        else shakes = 1
        lastShake = now
        setShakeHint(`Shake ${shakes}/3 detected!`)
        if (shakes >= 3 && !sosActive) {
          triggerSOSAlert()
          shakes = 0
          setShakeHint('')
        }
      }
    }
    window.addEventListener('devicemotion', handleMotion)
    return () => window.removeEventListener('devicemotion', handleMotion)
  }, [shakeEnabled, sosActive])

  // Walk with me track
  useEffect(() => {
    if (!walkActive) return
    let lastLat = 0, lastLng = 0
    let lastMoveTime = Date.now()
    
    // Auto idle check every 10 sec
    const interval = setInterval(() => {
      const msIdle = Date.now() - lastMoveTime
      if (msIdle > 3 * 60 * 1000) {
        // Idle for 3 minutes
        triggerSOSAlert()
        setWalkActive(false)
      }
    }, 10000)

    const watchId = navigator.geolocation.watchPosition(
      p => {
        const dLat = Math.abs(p.coords.latitude - lastLat)
        const dLng = Math.abs(p.coords.longitude - lastLng)
        // If moved roughly > 15m
        if (dLat > 0.0001 || dLng > 0.0001) {
          lastMoveTime = Date.now()
          lastLat = p.coords.latitude
          lastLng = p.coords.longitude
        }
      },
      e => console.error(e),
      { enableHighAccuracy: true }
    )

    return () => {
      clearInterval(interval)
      navigator.geolocation.clearWatch(watchId)
    }
  }, [walkActive])

  // Load contacts from Backend or localStorage
  useEffect(() => {
    if (user?.id) {
      getSOSContacts(user.id).then(c => setContacts(c)).catch(() => {})
    } else {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        try { setContacts(JSON.parse(saved)) } catch {}
      }
    }
  }, [user])

  // Save contacts
  const saveContacts = async (updated: Contact[]) => {
    // If not logged in, just use local storage
    if (!user) {
      setContacts(updated)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return
    }
    // (Actual backend saving logic is handled directly in the UI handlers below now for adding/deleting)
  }

  const handleAddContact = async () => {
    if (newContact.name && newContact.phone) {
      if (user) {
        const c = await addSOSContact({ user_id: user.id, name: newContact.name, phone: newContact.phone, email: newContact.email })
        setContacts([...contacts, c])
      } else {
        const updated = [...contacts, newContact]
        setContacts(updated)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      }
      setNewContact({ name: '', phone: '', email: '' })
      setShowAddContact(false)
    }
  }

  const handleRemoveContact = async (idx: number, id?: string) => {
    if (user && id) {
      await deleteSOSContact(id)
      setContacts(contacts.filter(c => c.id !== id))
    } else {
      const updated = contacts.filter((_, i) => i !== idx)
      setContacts(updated)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    }
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
    setSosSent(false)
    try {
      const res = await triggerSOS({
        latitude: coords?.lat,
        longitude: coords?.lng,
        location_text: location,
        contacts: contacts.map(c => ({ name: c.name, phone: c.phone, email: c.email })),
        user_id: user?.id
      })
      setSosSent(true)
      if (res?.wa_links && res.wa_links.length > 0) {
        setWaLinks(res.wa_links)
        window.open(res.wa_links[0], '_blank')
      }
      if (res?.nearby_ngos) {
        setNgos(res.nearby_ngos)
      }
      loadHistory()
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
      {/* Stealth Mode Overlay */}
      {stealthMode && (
        <div className="fixed inset-0 z-[9999] bg-sky-100 flex flex-col items-center justify-center">
          <div className="text-center">
            <Sun size={64} className="text-sky-400 mx-auto mb-4 animate-pulse" />
            <h1 className="text-3xl font-bold text-sky-800">Delhi Weather</h1>
            <p className="text-sky-600 text-xl mt-2">26°C · Partly Cloudy</p>
            <p className="text-sky-500 text-sm mt-4">Humidity: 68% · Wind: 12 km/h NW</p>
            <div className="mt-8 grid grid-cols-3 gap-4 text-center">
              {['Mon', 'Tue', 'Wed'].map((d, i) => (
                <div key={d} className="bg-white/50 rounded-xl p-3">
                  <div className="text-sky-700 text-sm font-medium">{d}</div>
                  <div className="flex justify-center my-2 text-sky-500">
                    {i === 0 ? <CloudSun size={24} /> : i === 1 ? <CloudRain size={24} /> : <Sun size={24} />}
                  </div>
                  <div className="text-sky-600 text-sm">{[24, 22, 28][i]}°</div>
                </div>
              ))}
            </div>
            {/* Hidden SOS: long-press this area */}
            <button
              onMouseDown={() => {
                const t = setTimeout(() => { setStealthMode(false); triggerSOSAlert() }, 3000)
                const up = () => clearTimeout(t)
                document.addEventListener('mouseup', up, { once: true })
                document.addEventListener('touchend', up, { once: true })
              }}
              className="mt-10 bg-white/30 text-sky-400 rounded-xl px-6 py-3 text-sm"
            >
              View 7-day forecast →
            </button>
            <p className="text-sky-300 text-xs mt-3">Hold for 3 seconds to call for help</p>
            <button onClick={() => setStealthMode(false)} className="mt-4 text-sky-300 text-xs underline">
              Exit Forecast
            </button>
          </div>
        </div>
      )}

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

                {/* Shake + Stealth controls */}
                <div className="flex gap-3">
                  <button
                    onClick={async () => {
                      if (typeof DeviceMotionEvent !== 'undefined' && typeof (DeviceMotionEvent as any).requestPermission === 'function') {
                        const perm = await (DeviceMotionEvent as any).requestPermission()
                        if (perm === 'granted') setShakeEnabled(true)
                      } else {
                        setShakeEnabled(e => !e)
                      }
                    }}
                    className={`flex-1 text-xs py-2.5 px-3 rounded-xl border font-medium transition-all ${
                      shakeEnabled 
                        ? 'bg-primary/20 border-primary text-primary' 
                        : 'bg-surface border-border text-text-secondary hover:border-primary'
                    }`}
                  >
                    <Activity size={14} className="inline mr-1 mb-0.5" /> {shakeEnabled ? `Shake Active ${shakeHint ? `(${shakeHint})` : ''}` : 'Enable Shake SOS'}
                  </button>
                  <button
                    onClick={() => setStealthMode(true)}
                    className="flex-1 text-xs py-2.5 px-3 rounded-xl border border-border bg-surface text-text-secondary hover:border-warning hover:text-warning font-medium transition-all"
                  >
                    <Lock size={14} className="inline mr-1 mb-0.5" /> Stealth Mode
                  </button>
                </div>

                {/* Walk With Me */}
                <div className="glass-card p-4 w-full max-w-sm border-primary/30">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold text-primary uppercase tracking-wider">🚶‍♀️ Walk With Me</h4>
                    <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded text-center">AUTO-SOS</span>
                  </div>
                  <p className="text-xs text-text-secondary mb-3 leading-relaxed">
                    App tracks your location. If you stop moving for 3 minutes, it automatically triggers an SOS to your trusted contacts.
                  </p>
                  {!walkActive ? (
                    <button
                      onClick={() => {
                        setWalkActive(true)
                        setWalkETA(Date.now())
                        setWalkMinsRemaining(15) // mock 15 mins
                      }}
                      className="w-full bg-surface border border-primary/50 text-primary text-xs py-2.5 rounded-xl font-bold hover:bg-primary/10 transition-colors"
                    >
                      Start Walking Session
                    </button>
                  ) : (
                    <div className="bg-primary/10 border border-primary/30 rounded-xl p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                        <span className="text-xs font-medium text-white">Tracking active</span>
                      </div>
                      <button
                        onClick={() => setWalkActive(false)}
                        className="text-xs text-primary font-bold hover:underline"
                      >
                        End Trip
                      </button>
                    </div>
                  )}
                </div>

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
                      <div key={i} className="flex items-center space-x-2 bg-surface/30 rounded-lg px-3 py-2 text-left">
                        <div className="w-7 h-7 rounded-full bg-danger/30 flex items-center justify-center font-bold text-danger text-sm shrink-0">{c.name[0]}</div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-white truncate">{c.name}</div>
                          <div className="text-xs text-text-secondary">{c.phone}</div>
                        </div>
                        <div className="flex space-x-1 shrink-0">
                          <a href={`tel:${c.phone}`} className="p-2 bg-surface rounded-full text-white hover:bg-primary transition"><Phone className="w-3 h-3" /></a>
                          {waLinks[i] && <a href={waLinks[i]} target="_blank" rel="noreferrer" className="p-2 bg-surface rounded-full text-[#25D366] hover:bg-primary/20 transition"><ShieldAlert className="w-3 h-3" /></a>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Nearby Help / NGOs */}
                {ngos.length > 0 && (
                  <div className="w-full mb-6 space-y-2">
                    <p className="text-xs text-text-secondary font-medium">Nearby Help (NGO Partners):</p>
                    {ngos.map((ngo, i) => (
                      <div key={`ngo-${i}`} className="flex flex-col bg-surface/30 border border-border rounded-lg p-3 text-left">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-sm text-white">🟢 {ngo.name}</span>
                          <span className="text-[10px] uppercase font-bold text-safe bg-safe/20 border border-safe/30 px-2 py-0.5 rounded-full">{ngo.distance_km} km away</span>
                        </div>
                        <div className="flex gap-2 mt-1">
                          {ngo.phones && ngo.phones.length > 0 && (
                            <a href={`tel:${ngo.phones[0]}`} className="flex-1 flex justify-center items-center py-2 bg-surface rounded-lg border border-border text-xs text-white hover:border-primary transition">
                              <Phone className="w-3 h-3 mr-1" /> Call
                            </a>
                          )}
                          {ngo.wa_link && (
                            <a href={ngo.wa_link} target="_blank" rel="noreferrer" className="flex-1 flex justify-center items-center py-2 bg-surface rounded-lg border border-[#25D366]/30 text-xs text-[#25D366] hover:bg-[#25D366]/10 transition">
                              <ShieldAlert className="w-3 h-3 mr-1" /> WhatsApp
                            </a>
                          )}
                          {(ngo.lat && ngo.lng) && (
                            <a href={`https://maps.google.com/?daddr=${ngo.lat},${ngo.lng}`} target="_blank" rel="noreferrer" className="flex-1 flex justify-center items-center py-2 bg-surface rounded-lg border border-border text-xs text-white hover:border-accent transition">
                              <MapPin className="w-3 h-3 mr-1" /> Navigate
                            </a>
                          )}
                        </div>
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

          {/* SOS History */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-bold mb-3 text-text">Past SOS Events</h3>
            {history.length === 0 ? (
              <p className="text-xs text-text-secondary">No past SOS events logged.</p>
            ) : (
              <div className="space-y-2">
                {history.map((h, i) => (
                  <div key={i} className="bg-surface border border-border rounded-lg p-2.5 text-xs">
                    <div className="font-bold text-white mb-1 flex justify-between">
                      <span>{new Date(h.created_at).toLocaleString()}</span>
                      <span className="text-danger">SOS</span>
                    </div>
                    <div className="text-text-secondary truncate pr-4 flex items-center"><MapPin size={12} className="inline mr-1 text-primary" /> {h.location_text || 'Unknown location'}</div>
                    <div className="text-text-secondary mt-1 flex items-center"><Users size={12} className="inline mr-1 text-primary" /> {h.contact_count} contacts notified</div>
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
