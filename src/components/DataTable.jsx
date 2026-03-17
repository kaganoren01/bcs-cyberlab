import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import SeverityBadge, { BADGE_COLUMNS } from './SeverityBadge';

const PAGE_SIZE = 50;

const LONG_TEXT_COLS = new Set([
  'VulnDescription', 'VulnMitigationSummary', 'TicketDescription',
  'IncidentRootCause', 'IncidentImpactSummary',
]);

export default function DataTable({ data, columns, primaryKey, onSelectRow }) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  const displayCols = columns.filter(c => !LONG_TEXT_COLS.has(c));

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter(row =>
      columns.some(col => String(row[col] ?? '').toLowerCase().includes(q))
    );
  }, [data, columns, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageData = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  function handleSearch(e) {
    setSearch(e.target.value);
    setPage(0);
  }

  return (
    <div className="data-table-wrap">
      <div className="table-controls">
        <div className="search-wrap">
          <Search size={14} className="search-icon" />
          <input
            className="search-input"
            type="text"
            placeholder="Search all fields..."
            value={search}
            onChange={handleSearch}
          />
        </div>
        <span className="record-count">{filtered.length.toLocaleString()} records</span>
      </div>

      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              {displayCols.map(col => <th key={col}>{col}</th>)}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {pageData.map((row, i) => (
              <tr key={row[primaryKey] ?? i} onClick={() => onSelectRow(row)} className="table-row">
                {displayCols.map(col => (
                  <td key={col} title={String(row[col] ?? '')}>
                    {BADGE_COLUMNS.has(col)
                      ? <SeverityBadge value={row[col]} />
                      : truncate(row[col])}
                  </td>
                ))}
                <td>
                  <button className="explain-btn" onClick={e => { e.stopPropagation(); onSelectRow(row); }}>
                    Explain →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button disabled={page === 0} onClick={() => setPage(p => p - 1)}>← Prev</button>
          <span>Page {page + 1} of {totalPages}</span>
          <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}
    </div>
  );
}

function truncate(val, max = 60) {
  const s = String(val ?? '');
  return s.length > max ? s.slice(0, max) + '…' : s;
}
