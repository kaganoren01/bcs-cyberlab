import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { X, Sparkles, AlertCircle } from 'lucide-react';
import { explainRecord } from '../utils/claude';
import SeverityBadge, { BADGE_COLUMNS } from './SeverityBadge';

export default function RecordPanel({ record, tableLabel, tableDescription, onClose }) {
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleExplain() {
    setLoading(true);
    setError('');
    setExplanation('');
    try {
      const text = await explainRecord(tableLabel, tableDescription, record);
      setExplanation(text);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (!record) return null;

  return (
    <div className="record-panel">
      <div className="panel-header">
        <h3>Record Detail</h3>
        <button className="close-btn" onClick={onClose}><X size={16} /></button>
      </div>

      <div className="record-fields">
        {Object.entries(record).map(([key, val]) => (
          <div key={key} className="record-field">
            <span className="field-key">{key}</span>
            <span className="field-val">
              {BADGE_COLUMNS.has(key)
                ? <SeverityBadge value={val} />
                : val === '' ? <em className="null-val">null</em> : String(val)}
            </span>
          </div>
        ))}
      </div>

      <div className="explain-section">
        <button className="explain-primary-btn" onClick={handleExplain} disabled={loading}>
          <Sparkles size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
          {loading ? 'Analyzing with AI...' : 'Explain This Record with AI'}
        </button>

        {error && (
          <div className="explain-error">
            <AlertCircle size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
            {error}
          </div>
        )}

        {explanation && (
          <div className="explanation">
            <div className="explanation-header">
              <Sparkles size={12} />
              AI Instructor Explanation
            </div>
            <div className="markdown-body">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {explanation}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
