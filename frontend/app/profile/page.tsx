'use client'
import { useState, useEffect } from 'react'
import { useUser, SignOutButton } from '@clerk/nextjs'
import { ShieldCheck, MapPin, User, LogOut, Clock, Navigation, AlertCircle, Plus, Trash2 } from 'lucide-react'
import { getSOSContacts, addSOSContact, deleteSOSContact, getSOSHistory, getSavedRoutes, addSavedRoute, deleteSavedRoute, getIncidents } from '@/lib/api'

export default function ProfilePage() {
  const { user, isLoaded, isSignedIn } = useUser()
  const [activeTab, setActiveTab] = useState('contacts')
  
  // Data States
  const [contacts, setContacts] = useState<any[]>([])
  const [history, setHistory] = useState<any[]>([])
  const [routes, setRoutes] = useState<any[]>([])
  const [reports, setReports] = useState<any[]>([])
  
  // Forms
  const [newContact, setNewContact] = useState({ name: '', phone: '', email: '' })
  const [newRoute, setNewRoute] = useState({ name: '', start: '', end: '' })

  const loadData = async () => {
    if (!user) return
    try {
      const [c, h, r, p] = await Promise.all([
        getSOSContacts(user.id),
        getSOSHistory(user.id),
        getSavedRoutes(user.id),
        getIncidents({ user_id: user.id })
      ])
      setContacts(c || [])
      setHistory(h || [])
      setRoutes(r || [])
      setReports(p || [])
    } catch (e) {
      console.error('Failed to fetch personal data', e)
    }
  }

  useEffect(() => {
    loadData()
  }, [user])

  if (!isLoaded) return <div className="min-h-screen pt-24 text-center">Loading...</div>
  
  if (!isSignedIn) {
    return (
      <div className="min-h-screen pt-24 text-center">
        <h2 className="text-2xl font-bold mb-4">Please Sign In</h2>
        <p className="text-text-secondary">You must be signed in to view your personalized Safety Profile.</p>
      </div>
    )
  }

  const handleAddContact = async () => {
    if (newContact.name && newContact.phone) {
      const c = await addSOSContact({ user_id: user.id, ...newContact })
      setContacts([...contacts, c])
      setNewContact({ name: '', phone: '', email: '' })
    }
  }

  const handleAddRoute = async () => {
    if (newRoute.name) {
      const r = await addSavedRoute({
        user_id: user.id,
        name: newRoute.name,
        start_address: newRoute.start,
        end_address: newRoute.end,
        start_lat: 28.6139, start_lng: 77.2090, // default Delhi placeholder
        end_lat: 28.5355, end_lng: 77.3910
      })
      setRoutes([...routes, r])
      setNewRoute({ name: '', start: '', end: '' })
    }
  }

  return (
    <div className="min-h-screen pt-24 pb-12 bg-background relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-primary/5 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 left-0 w-[30rem] h-[30rem] bg-accent/5 rounded-full blur-[100px] -z-10" />

      <div className="max-w-5xl mx-auto px-4 md:px-8 flex flex-col md:flex-row gap-8">
        
        {/* Left Sidebar: Identity */}
        <div className="w-full md:w-1/3 flex flex-col gap-6">
          <div className="glass-card p-6 border-t border-t-white/10 rounded-2xl flex flex-col items-center">
            <img src={user.imageUrl} alt="Avatar" className="w-24 h-24 rounded-full border-4 border-primary/20 mb-4" />
            <h1 className="text-2xl font-bold text-white">{user.fullName || user.username}</h1>
            <p className="text-text-secondary mb-6">{user.primaryEmailAddress?.emailAddress}</p>
            
            <div className="w-full bg-surface p-4 rounded-xl flex items-center justify-between mb-4 border border-border">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-safe" />
                <span className="text-sm font-medium">Account Status</span>
              </div>
              <span className="text-xs font-bold text-safe bg-safe/20 px-2 py-1 rounded">VERIFIED</span>
            </div>
            
            <SignOutButton>
              <button className="w-full py-2.5 flex items-center justify-center gap-2 text-danger hover:bg-danger/10 transition-colors rounded-xl font-medium">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </SignOutButton>
          </div>

          {/* Navigation Links */}
          <div className="flex flex-col gap-2">
            {[
              { id: 'contacts', label: 'Trusted Contacts', icon: User },
              { id: 'routes', label: 'Saved Routes', icon: Navigation },
              { id: 'history', label: 'SOS History', icon: Clock },
              { id: 'reports', label: 'My Reports', icon: AlertCircle }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left font-medium ${
                  activeTab === tab.id ? 'bg-primary text-white shadow-lg' : 'hover:bg-surface text-text-secondary'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right Content */}
        <div className="w-full md:w-2/3 glass-card rounded-2xl p-6 min-h-[500px]">
          
          {/* TAB: Contacts */}
          {activeTab === 'contacts' && (
            <div className="animate-in fade-in slide-in-from-bottom-4">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><User className="text-primary"/> Trusted SOS Contacts</h2>
              <div className="grid gap-4 mb-8">
                {contacts.length === 0 ? <p className="text-text-secondary">No trusted contacts added.</p> : contacts.map(c => (
                  <div key={c.id} className="p-4 bg-surface rounded-xl border border-border flex justify-between items-center group">
                    <div>
                      <h4 className="font-bold text-white">{c.name}</h4>
                      <p className="text-xs text-text-secondary">{c.phone}</p>
                    </div>
                    <button 
                      onClick={async () => { await deleteSOSContact(c.id); setContacts(contacts.filter(x => x.id !== c.id)) }}
                      className="p-2 text-text-secondary hover:text-danger hover:bg-danger/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="bg-surface/50 p-4 rounded-xl border border-primary/30">
                <h4 className="font-bold text-sm mb-3">Add New Contact</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <input placeholder="Name" value={newContact.name} onChange={e => setNewContact({...newContact, name: e.target.value})} className="bg-background border border-border rounded-lg px-3 py-2 text-sm" />
                  <input placeholder="Phone" value={newContact.phone} onChange={e => setNewContact({...newContact, phone: e.target.value})} className="bg-background border border-border rounded-lg px-3 py-2 text-sm" />
                </div>
                <button onClick={handleAddContact} className="bg-primary/20 text-primary border border-primary/50 text-xs px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-primary/30">
                  <Plus className="w-3 h-3"/> Add Contact
                </button>
              </div>
            </div>
          )}

          {/* TAB: Routes */}
          {activeTab === 'routes' && (
            <div className="animate-in fade-in slide-in-from-bottom-4">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Navigation className="text-accent"/> Saved Routes</h2>
              <div className="grid gap-4 mb-8">
                {routes.length === 0 ? <p className="text-text-secondary">No saved routes yet. Add places like Home to Work.</p> : routes.map(r => (
                  <div key={r.id} className="p-4 bg-surface rounded-xl border border-border flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-white">{r.name}</h4>
                      <div className="flex items-center gap-2 text-xs text-text-secondary mt-1">
                        <MapPin className="w-3 h-3 text-accent" /> {r.start_address || 'Current'} → {r.end_address}
                      </div>
                    </div>
                    <button 
                      onClick={async () => { await deleteSavedRoute(r.id); setRoutes(routes.filter(x => x.id !== r.id)) }}
                      className="p-2 text-text-secondary hover:text-danger rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="bg-surface/50 p-4 rounded-xl border border-accent/30">
                <h4 className="font-bold text-sm mb-3">Save a Route</h4>
                <div className="grid gap-3 mb-3">
                  <input placeholder="Route Name (e.g., Home to Gym)" value={newRoute.name} onChange={e => setNewRoute({...newRoute, name: e.target.value})} className="bg-background border border-border rounded-lg px-3 py-2 text-sm" />
                  <div className="grid grid-cols-2 gap-3">
                    <input placeholder="Start Address" value={newRoute.start} onChange={e => setNewRoute({...newRoute, start: e.target.value})} className="bg-background border border-border rounded-lg px-3 py-2 text-sm" />
                    <input placeholder="End Address" value={newRoute.end} onChange={e => setNewRoute({...newRoute, end: e.target.value})} className="bg-background border border-border rounded-lg px-3 py-2 text-sm" />
                  </div>
                </div>
                <button onClick={handleAddRoute} className="bg-accent/20 text-accent border border-accent/50 text-xs px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-accent/30">
                  <Plus className="w-3 h-3"/> Save Route
                </button>
              </div>
            </div>
          )}

          {/* TAB: History */}
          {activeTab === 'history' && (
            <div className="animate-in fade-in slide-in-from-bottom-4">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Clock className="text-danger"/> Emergency History</h2>
              {history.length === 0 ? <p className="text-text-secondary">You haven't triggered any SOS alerts.</p> : (
                <div className="border-l-2 border-danger/20 ml-3 pl-6 space-y-6">
                  {history.map(h => (
                    <div key={h.id} className="relative">
                      <div className="absolute w-3 h-3 bg-danger rounded-full -left-[31px] top-1 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                      <h4 className="text-sm font-bold text-white mb-1">Emergency SOS Triggered</h4>
                      <p className="text-xs text-text-secondary mb-2">{new Date(h.created_at).toLocaleString()}</p>
                      <p className="text-xs text-text-3 bg-surface border border-border p-3 rounded-lg">
                        <MapPin className="w-3 h-3 inline mr-1 text-primary"/> {h.location_text || `${h.latitude}, ${h.longitude}`}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: Reports */}
          {activeTab === 'reports' && (
            <div className="animate-in fade-in slide-in-from-bottom-4">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><AlertCircle className="text-warning"/> My Incident Reports</h2>
              <div className="grid gap-4">
                {reports.length === 0 ? <p className="text-text-secondary">You haven't reported any incidents yet.</p> : reports.map(r => (
                  <div key={r.id} className="p-4 bg-surface rounded-xl border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase text-warning bg-warning/10 px-2 py-0.5 rounded-full">{r.incident_type.replace('_', ' ')}</span>
                      <span className="text-xs text-text-secondary">{new Date(r.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-white mb-3 line-clamp-2">{r.description}</p>
                    <div className="flex gap-2">
                      <span className="text-[10px] bg-primary/20 text-primary px-2 py-1 rounded">👍 {r.upvotes} Upvotes</span>
                      <span className="text-[10px] bg-safe/20 text-safe px-2 py-1 rounded">{'★'.repeat(5)} Verified</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
