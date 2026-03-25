// Shared helpers used across all Analytics tab components

export const SEV_COLORS = { Critical: '#f87171', High: '#fbbf24', Medium: '#60a5fa', Low: '#34d399' };
export const BAR_COLORS = ['#60a5fa', '#a78bfa', '#34d399', '#fbbf24', '#f87171'];

export function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#21262d', border: '1px solid #30363d', borderRadius: 6, padding: '8px 12px', fontSize: '0.78rem' }}>
      <strong style={{ color: '#e6edf3' }}>{payload[0].name || payload[0].payload?.name}</strong>
      <div style={{ color: '#8b949e' }}>{payload[0].value?.toLocaleString()}</div>
    </div>
  );
}

export function SectionHeader({ icon: Icon, title }) {
  return (
    <div className="analytics-section-header">
      <Icon size={16} />
      <h2>{title}</h2>
    </div>
  );
}

export function MetricCard({ label, value, sub, color }) {
  return (
    <div className="metric-card" style={{ '--mc-color': color ?? 'var(--blue)' }}>
      <div className="metric-value">{value}</div>
      <div className="metric-label">{label}</div>
      {sub && <div className="metric-sub">{sub}</div>}
    </div>
  );
}

export function TopNTable({ rows, valueLabel = 'Count' }) {
  if (!rows?.length) return <div className="analytics-empty">No data</div>;
  const max = rows[0].value;
  return (
    <table className="analytics-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Name</th>
          <th>{valueLabel}</th>
          <th style={{ width: 120 }}></th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={row.name}>
            <td className="rank">{i + 1}</td>
            <td>{row.name}</td>
            <td>{row.value.toLocaleString()}</td>
            <td>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${(row.value / max) * 100}%`, background: BAR_COLORS[i % BAR_COLORS.length] }} />
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function RefBanner({ sources }) {
  if (!sources?.length) return null;
  return (
    <div className="ref-banner">
      <span className="ref-banner-label">Inspired by: </span>
      {sources.map((s, i) => (
        <span key={s.name}>
          {i > 0 && <span className="ref-banner-sep"> · </span>}
          {s.url ? (
            <a href={s.url} target="_blank" rel="noopener noreferrer" className="ref-banner-link">
              {s.name}
            </a>
          ) : (
            <span className="ref-banner-source">{s.name}</span>
          )}
        </span>
      ))}
    </div>
  );
}
