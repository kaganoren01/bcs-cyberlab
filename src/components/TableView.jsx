import { useState, useMemo } from 'react';
import { useTableData } from '../hooks/useTableData';
import { transformRows } from '../utils/columnLabels';
import { TABLES } from '../utils/schema';
import DataTable from './DataTable';
import RecordPanel from './RecordPanel';

// Tables that have a ClientID column and support client filtering
const HAS_CLIENT_ID = new Set(['INCIDENT', 'TICKET', 'ASSET', 'SLA_CONTRACT', 'CLIENT_CONTACT']);

export default function TableView({ tableKey, table }) {
  const { data: rawData, loading, error } = useTableData(tableKey, table.file);
  const { data: clients } = useTableData('CLIENT', TABLES.CLIENT.file);

  const [selectedRecord, setSelectedRecord] = useState(null);
  const [clientFilter, setClientFilter] = useState('');

  const data = useMemo(() => transformRows(tableKey, rawData), [tableKey, rawData]);

  // Build sorted client options for the dropdown
  // Build dropdown options deduped by name; each entry holds all matching IDs
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

  const filteredData = useMemo(() => {
    if (!clientFilter) return data;
    const option = clientOptions.find(o => o.name === clientFilter);
    if (!option) return data;
    return data.filter(row => option.ids.has(String(row.ClientID)));
  }, [data, clientFilter, clientOptions]);

  if (loading) return <div className="state-msg">Loading {table.label}...</div>;
  if (error)   return <div className="state-msg error">Error loading data: {error}</div>;

  const showClientFilter = HAS_CLIENT_ID.has(tableKey) && clientOptions.length > 0;

  return (
    <div className="table-view">
      <div className="table-header">
        <div>
          <h2>{table.label}</h2>
          <p className="table-desc">{table.description}</p>
        </div>
        <div className="table-header-right">
          {showClientFilter && (
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
