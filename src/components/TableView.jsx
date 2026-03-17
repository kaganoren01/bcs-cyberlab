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
  const clientOptions = useMemo(() => {
    if (!HAS_CLIENT_ID.has(tableKey)) return [];
    return [...clients]
      .sort((a, b) => String(a.ClientName).localeCompare(String(b.ClientName)))
      .map(c => ({ id: String(c.ClientID), name: c.ClientName }));
  }, [tableKey, clients]);

  const filteredData = useMemo(() => {
    if (!clientFilter) return data;
    return data.filter(row => String(row.ClientID) === clientFilter);
  }, [data, clientFilter]);

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
                <option key={c.id} value={c.id}>{c.name}</option>
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
