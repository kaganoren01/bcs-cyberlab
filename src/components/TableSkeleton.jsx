export default function TableSkeleton({ label }) {
  return (
    <div className="skeleton-wrap">
      <div className="skeleton-header">
        <div className="skeleton-bar" style={{ width: 140 }} />
        <div className="skeleton-bar" style={{ width: 80 }} />
      </div>
      <div className="skeleton-table">
        <div className="skeleton-thead">
          {[120, 90, 110, 80, 100, 75].map((w, i) => (
            <div key={i} className="skeleton-th" style={{ width: w }} />
          ))}
        </div>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="skeleton-row" style={{ opacity: 1 - i * 0.07 }}>
            {[120, 90, 110, 80, 100, 75].map((w, j) => (
              <div key={j} className="skeleton-cell">
                <div className="skeleton-bar shimmer" style={{ width: w * (0.5 + Math.random() * 0.5) }} />
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="skeleton-label">Loading {label}…</div>
    </div>
  );
}
