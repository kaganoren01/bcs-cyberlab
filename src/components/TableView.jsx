import { useState, useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useTableData } from '../hooks/useTableData';
import { transformRows } from '../utils/columnLabels';
import { TABLES } from '../utils/schema';
import DataTable from './DataTable';
import RecordPanel from './RecordPanel';
import TableSkeleton from './TableSkeleton';

const HAS_CLIENT_ID = new Set(['INCIDENT', 'TICKET', 'ASSET', 'SLA_CONTRACT', 'CLIENT_CONTACT']);

export default function TableView({ tableKey, table }) {
  const { data: rawData, loading, error } = useTableData(tableKey, table.file);
  const { data: clients } = useTableData('CLIENT', TABLES.CLIENT.file);

  const [selectedRecord, setSelectedRecord] = useState(null);
  const [clientFilter, setClientFilter] = useState('');
  const [fieldFilters, setFieldFilters] = useState({});

  const data = useMemo(() => transformRows(tableKey, rawData), [tableKey, rawData]);

  // Client dropdown — deduplicated by name
  const clientOptions = useMemo(() => {
    if (!HAS_CLIENT_ID.has(tableKey)) return [];
    const nameToIds = {};
    clients.forEach(c => {
      const name = c.ClientName || `Client ${c.ClientID}`;
      if (!nameToIds[name]) nameToIds[name] = new Set();
      nameToIds[name].add(String(c.ClientID));
    });
    return Object.entries(nameToIds)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, ids]) => ({ name, ids }));
  }, [tableKey, clients]);

  // Secondary field filters — distinct values per configured field
  const filterDefs = table.filterBy ?? [];
  const fieldOptions = useMemo(() =>
    filterDefs.map(({ field }) => {
      const vals = new Set(data.map(row => row[field]).filter(Boolean));
      return [...vals].sort();
    }),
  [data, filterDefs]);

  const filteredData = useMemo(() => {
    let rows = data;
    if (clientFilter) {
      const option = clientOptions.find(o => o.name === clientFilter);
      if (option) rows = rows.filter(row => option.ids.has(String(row.ClientID)));
    }
    filterDefs.forEach(({ field }) => {
      const val = fieldFilters[field];
      if (val) rows = rows.filter(row => row[field] === val);
    });
    return rows;
  }, [data, clientFilter, clientOptions, fieldFilters, filterDefs]);

  if (loading) return <TableSkeleton label={table.label} />;
  if (error) return (
    <div className="empty-state">
      <AlertTriangle size={32} className="empty-icon" style={{ color: 'var(--red)' }} />
      <div className="empty-title">Failed to load {table.label}</div>
      <div className="empty-desc">{error}</div>
    </div>
  );

  function resetFilters() {
    setClientFilter('');
    setFieldFilters({});
    setSelectedRecord(null);
  }

  const hasActiveFilter = clientFilter || Object.values(fieldFilters).some(Boolean);

  return (
    <div className="table-view">
      <div className="table-header">
        <div>
          <h2>{table.label}</h2>
          <p className="table-desc">{table.description}</p>
        </div>
        <div className="table-header-right">
          {HAS_CLIENT_ID.has(tableKey) && clientOptions.length > 0 && (
            <select
              className="client-filter-select"
              value={clientFilter}
              onChange={e => { setClientFilter(e.target.value); setSelectedRecord(null); }}
            >
              <option value="">All Clients</option>
              {clientOptions.map(c => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
          )}
          {filterDefs.map((def, i) => fieldOptions[i]?.length > 0 && (
            <select
              key={def.field}
              className="client-filter-select"
              value={fieldFilters[def.field] ?? ''}
              onChange={e => { setFieldFilters(prev => ({ ...prev, [def.field]: e.target.value })); setSelectedRecord(null); }}
            >
              <option value="">All {def.label}s</option>
              {fieldOptions[i].map(val => (
                <option key={val} value={val}>{val}</option>
              ))}
            </select>
          ))}
          {hasActiveFilter && (
            <button className="clear-filter-btn" onClick={resetFilters}>Clear ✕</button>
          )}
          <span className="badge">{filteredData.length.toLocaleString()} rows</span>
        </div>
      </div>

      <div className={`table-content ${selectedRecord ? 'with-panel' : ''}`}>
        <DataTable
          data={filteredData}
          columns={table.columns}
          primaryKey={table.primaryKey}
          onSelectRow={setSelectedRecord}
        />
        {selectedRecord && (
          <RecordPanel
            record={selectedRecord}
            tableLabel={table.label}
            tableDescription={table.description}
            onClose={() => setSelectedRecord(null)}
          />
        )}
      </div>
    </div>
  );
}
