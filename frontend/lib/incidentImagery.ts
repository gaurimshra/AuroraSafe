export const getIncidentImage = (type?: string) => {
  const t = type?.toLowerCase() || 'other'
  if (t.includes('theft')) return 'https://images.unsplash.com/photo-1549558549-415fe4c37b60?auto=format&fit=crop&w=800&q=80' // Crowded street
  if (t.includes('assault')) return 'https://images.unsplash.com/photo-1533036814981-e28a55c6db20?auto=format&fit=crop&w=800&q=80' // Dark alley
  if (t.includes('harassment')) return 'https://images.unsplash.com/photo-1517400508447-f8dd518b86db?auto=format&fit=crop&w=800&q=80' // Subway station
  if (t.includes('suspicious')) return 'https://images.unsplash.com/photo-1605806616949-1e87b487cb2a?auto=format&fit=crop&w=800&q=80' // CCTV
  if (t.includes('vandalism')) return 'https://images.unsplash.com/photo-1555178693-e403fa8a3683?auto=format&fit=crop&w=800&q=80' // Graffiti
  if (t.includes('accident')) return 'https://images.unsplash.com/photo-1520698194488-84224cff0be7?auto=format&fit=crop&w=800&q=80' // Traffic
  return 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=800&q=80' // Generic city night
}
