import { useState, useEffect } from 'react';
import Papa from 'papaparse';

const cache = {};

export function useTableData(tableKey, filePath) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!filePath) return;
    if (cache[tableKey]) {
      setData(cache[tableKey]);
      return;
    }
    setLoading(true);
    setError(null);
    Papa.parse(filePath, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        cache[tableKey] = results.data;
        setData(results.data);
        setLoading(false);
      },
      error: (err) => {
        setError(err.message);
        setLoading(false);
      },
    });
  }, [tableKey, filePath]);

  return { data, loading, error };
}
