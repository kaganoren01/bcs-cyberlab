const COLORS = {
  // Severity
  critical:    { bg: '#3d1a1a', color: '#f85149', border: '#6d2020' },
  high:        { bg: '#2d1f0a', color: '#e3932a', border: '#5a3a10' },
  medium:      { bg: '#2d2600', color: '#d29922', border: '#5a4a00' },
  low:         { bg: '#0d2a0d', color: '#3fb950', border: '#1a5c1a' },
  info:        { bg: '#0d1f3d', color: '#58a6ff', border: '#1a3a6d' },
  // Status
  open:        { bg: '#2d1f0a', color: '#e3932a', border: '#5a3a10' },
  'in progress': { bg: '#0d1f3d', color: '#58a6ff', border: '#1a3a6d' },
  resolved:    { bg: '#0d2a0d', color: '#3fb950', border: '#1a5c1a' },
  closed:      { bg: '#0d2a0d', color: '#3fb950', border: '#1a5c1a' },
  remediated:  { bg: '#0d2a0d', color: '#3fb950', border: '#1a5c1a' },
  active:      { bg: '#0d2a0d', color: '#3fb950', border: '#1a5c1a' },
  inactive:    { bg: '#1a1a1a', color: '#8b949e', border: '#30363d' },
  // Priority
  p1:          { bg: '#3d1a1a', color: '#f85149', border: '#6d2020' },
  p2:          { bg: '#2d1f0a', color: '#e3932a', border: '#5a3a10' },
  p3:          { bg: '#2d2600', color: '#d29922', border: '#5a4a00' },
  p4:          { bg: '#0d1f3d', color: '#58a6ff', border: '#1a3a6d' },
  // Boolean
  '1':         { bg: '#0d2a0d', color: '#3fb950', border: '#1a5c1a' },
  '0':         { bg: '#1a1a1a', color: '#8b949e', border: '#30363d' },
  yes:         { bg: '#0d2a0d', color: '#3fb950', border: '#1a5c1a' },
  no:          { bg: '#1a1a1a', color: '#8b949e', border: '#30363d' },
};

const FALLBACK = { bg: '#21262d', color: '#8b949e', border: '#30363d' };

export default function SeverityBadge({ value }) {
  const key = String(value ?? '').toLowerCase().trim();
  const style = COLORS[key] ?? FALLBACK;
  return (
    <span style={{
      display: 'inline-block',
      padding: '1px 8px',
      borderRadius: '12px',
      fontSize: '0.72rem',
      fontWeight: 600,
      letterSpacing: '0.3px',
      background: style.bg,
      color: style.color,
      border: `1px solid ${style.border}`,
      whiteSpace: 'nowrap',
    }}>
      {value}
    </span>
  );
}

// Columns that should render as badges
export const BADGE_COLUMNS = new Set([
  'IncidentSeverity', 'AlertSeverity', 'VulnSeverity', 'TicketPriority',
  'SLA_SeverityLevel', 'AssetVulnStatus', 'IncidentStatus', 'TicketCurrentStatus',
  'AssetStatus', 'AnalystIsActive', 'ClientIsActive', 'AlertIsEscalatedToIncident',
  'IsPrimaryContact', 'AssetBusinessCriticality',
]);
