export const getIncidentImage = (type?: string) => {
  const t = type?.toLowerCase() || 'other'
  if (t.includes('theft')) return 'https://picsum.photos/seed/theft/800/600'
  if (t.includes('assault')) return 'https://picsum.photos/seed/assault/800/600'
  if (t.includes('harassment')) return 'https://picsum.photos/seed/harassment/800/600'
  if (t.includes('suspicious')) return 'https://picsum.photos/seed/suspicious/800/600'
  if (t.includes('vandalism')) return 'https://picsum.photos/seed/vandalism/800/600'
  if (t.includes('accident')) return 'https://picsum.photos/seed/accident/800/600'
  return 'https://picsum.photos/seed/general/800/600'
}
