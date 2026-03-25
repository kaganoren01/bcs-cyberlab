import { useState, useMemo } from 'react';
import { Search, SearchX, ChevronRight } from 'lucide-react';
import SeverityBadge, { BADGE_COLUMNS } from './SeverityBadge';
import { getLabel } from '../utils/columnLabels';

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
              {displayCols.map(col => <th key={col}>{getLabel(col)}</th>)}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {pageData.length === 0 && (
              <tr>
                <td colSpan={displayCols.length + 1}>
                  <div className="empty-state table-empty">
                    <SearchX size={28} className="empty-icon" />
                    <div className="empty-title">No results found</div>
                    <div className="empty-desc">
                      {search ? `No records match "${search}" — try a different search term.` : 'No records match the current filters.'}
                    </div>
                  </div>
                </td>
              </tr>
            )}
            {pageData.map((row, i) => (
              <tr key={row[primaryKey] ?? i} onClick={() => onSelectRow(row)} className="table-row">
                {displayCols.map(col => (
                  <td key={col} title={String(row[col] ?? '')}>
                    {BADGE_COLUMNS.has(col)
                      ? <SeverityBadge value={row[col]} />
                      : truncate(row[col])}
                  </td>
                ))}
                <td style={{ width: 28, padding: '7px 8px' }}>
                  <ChevronRight size={13} className="row-arrow" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button className="page-btn" disabled={page === 0} onClick={() => setPage(p => p - 1)}>←</button>
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            const p = totalPages <= 7 ? i : page < 4 ? i : page > totalPages - 5 ? totalPages - 7 + i : page - 3 + i;
            return (
              <button key={p} className={`page-btn${p === page ? ' active' : ''}`} onClick={() => setPage(p)}>{p + 1}</button>
            );
          })}
          <button className="page-btn" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>→</button>
          <span className="page-info">{filtered.length.toLocaleString()} total</span>
        </div>
      )}
    </div>
  );
}

function truncate(val, max = 60) {
  const s = String(val ?? '');
  return s.length > max ? s.slice(0, max) + '…' : s;
}
