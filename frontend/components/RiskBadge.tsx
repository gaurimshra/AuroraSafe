export default function RiskBadge({ zone }: { zone: string }) {
  const styles: Record<string, { label: string; emoji: string; className: string }> = {
    red:    { label: 'Danger',  emoji: '⚠',  className: 'badge badge-danger' },
    yellow: { label: 'Caution', emoji: '◑',  className: 'badge badge-warn' },
    green:  { label: 'Safe',    emoji: '✓',  className: 'badge badge-safe' },
  }
  const s = styles[zone] || styles.yellow
  return <span className={s.className}>{s.emoji} {s.label}</span>
}
