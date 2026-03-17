import { useState, useMemo } from 'react';
import { useTableData } from '../hooks/useTableData';
import { transformRows } from '../utils/columnLabels';
import { TABLES } from '../utils/schema';
import DataTable from './DataTable';
import RecordPanel from './RecordPanel';

const HAS_CLIENT_ID = new Set(['INCIDENT', 'TICKET', 'ASSET', 'SLA_CONTRACT', 'CLIENT_CONTACT']);

export default function TableView({ tableKey, table }) {
  const { data: rawData, loading, error } = useTableData(tableKey, table.file);
  const { data: clients } = useTableData('CLIENT', TABLES.CLIENT.file);

  const [selectedRecord, setSelectedRecord] = useState(null);
  const [clientFilter, setClientFilter] = useState('');
  const [fieldFilter, setFieldFilter] = useState('');

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

  // Secondary field filter (e.g. Status for Tickets) — distinct values from data
  const fieldOptions = useMemo(() => {
    if (!table.filterBy) return [];
    const vals = new Set(data.map(row => row[table.filterBy.field]).filter(Boolean));
    return [...vals].sort();
  }, [data, table.filterBy]);

  const filteredData = useMemo(() => {
    let rows = data;
    if (clientFilter) {
      const option = clientOptions.find(o => o.name === clientFilter);
      if (option) rows = rows.filter(row => option.ids.has(String(row.ClientID)));
    }
    if (fieldFilter && table.filterBy) {
      rows = rows.filter(row => row[table.filterBy.field] === fieldFilter);
    }
    return rows;
  }, [data, clientFilter, clientOptions, fieldFilter, table.filterBy]);

  if (loading) return <div className="state-msg">Loading {table.label}...</div>;
  if (error)   return <div className="state-msg error">Error loading data: {error}</div>;

  function resetFilters() {
    setClientFilter('');
    setFieldFilter('');
    setSelectedRecord(null);
  }

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
          {table.filterBy && fieldOptions.length > 0 && (
            <select
              className="client-filter-select"
              value={fieldFilter}
              onChange={e => { setFieldFilter(e.target.value); setSelectedRecord(null); }}
            >
              <option value="">All {table.filterBy.label}es</option>
              {fieldOptions.map(val => (
                <option key={val} value={val}>{val}</option>
              ))}
            </select>
          )}
          {(clientFilter || fieldFilter) && (
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
