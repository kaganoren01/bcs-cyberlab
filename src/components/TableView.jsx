import { useState } from 'react';
import { useTableData } from '../hooks/useTableData';
import DataTable from './DataTable';
import RecordPanel from './RecordPanel';

export default function TableView({ tableKey, table }) {
  const { data, loading, error } = useTableData(tableKey, table.file);
  const [selectedRecord, setSelectedRecord] = useState(null);

  if (loading) return <div className="state-msg">Loading {table.label}...</div>;
  if (error) return <div className="state-msg error">Error loading data: {error}</div>;

  return (
    <div className="table-view">
      <div className="table-header">
        <div>
          <h2>{table.label}</h2>
          <p className="table-desc">{table.description}</p>
        </div>
        <span className="badge">{data.length.toLocaleString()} rows</span>
      </div>

      <div className={`table-content ${selectedRecord ? 'with-panel' : ''}`}>
        <DataTable
          data={data}
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
