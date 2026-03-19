import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { X, Sparkles, AlertCircle, ExternalLink, Loader } from 'lucide-react';
import { explainRecord } from '../utils/claude';
import SeverityBadge, { BADGE_COLUMNS } from './SeverityBadge';
import { getLabel } from '../utils/columnLabels';

function extractCveId(record) {
  if (!record) return null;
  const cveVal = record.VulnCVE;
  if (!cveVal) return null;
  const match = String(cveVal).match(/^(CVE-\d{4}-\d+)/i);
  return match ? match[1].toUpperCase() : null;
}

function formatNvdDate(dateStr) {
  if (!dateStr) return 'N/A';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

function extractCvssMetrics(nvdItem) {
  if (!nvdItem) return null;
  const metrics = nvdItem.metrics || {};
  // Try v3.1, v3.0, then v2
  const v31 = metrics.cvssMetricV31?.[0];
  const v30 = metrics.cvssMetricV30?.[0];
  const v2  = metrics.cvssMetricV2?.[0];
  const best = v31 || v30 || v2;
  if (!best) return null;
  const cvss = best.cvssData || best;
  return {
    version: cvss.version || (v2 ? '2.0' : '3.x'),
    baseScore: cvss.baseScore ?? null,
    baseSeverity: cvss.baseSeverity || best.baseSeverity || null,
    vectorString: cvss.vectorString || null,
  };
}

export default function RecordPanel({ record, tableLabel, tableDescription, onClose }) {
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // NVD enrichment state
  const [nvdData, setNvdData]       = useState(null);
  const [nvdLoading, setNvdLoading] = useState(false);
  const [nvdError, setNvdError]     = useState('');

  // Reset NVD state when record changes
  useEffect(() => {
    setNvdData(null);
    setNvdLoading(false);
    setNvdError('');
  }, [record]);

  async function handleExplain() {
    setLoading(true);
    setError('');
    setExplanation('');
    try {
      await explainRecord(tableLabel, tableDescription, record, (chunk) => {
        setLoading(false);
        setExplanation(prev => prev + chunk);
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleFetchNvd() {
    const cveId = extractCveId(record);
    if (!cveId) return;
    setNvdLoading(true);
    setNvdError('');
    setNvdData(null);
    try {
      const url = `https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=${encodeURIComponent(cveId)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`NVD API responded with HTTP ${res.status}`);
      const json = await res.json();
      const item = json?.vulnerabilities?.[0]?.cve;
      if (!item) throw new Error(`${cveId} was not found in NVD. This dataset uses anonymized placeholder CVE IDs that do not correspond to real NVD entries.`);
      setNvdData(item);
    } catch (e) {
      setNvdError(e.message || 'Failed to fetch CVE data');
    } finally {
      setNvdLoading(false);
    }
  }

  if (!record) return null;

  const cveId = extractCveId(record);
  const cvssMetrics = nvdData ? extractCvssMetrics(nvdData) : null;
  const englishDesc = nvdData?.descriptions?.find(d => d.lang === 'en')?.value || '';
  const truncatedDesc = englishDesc.length > 300 ? englishDesc.slice(0, 297) + '…' : englishDesc;

  return (
    <div className="record-panel">
      <div className="panel-header">
        <h3>Record Detail</h3>
        <button className="close-btn" onClick={onClose}><X size={16} /></button>
      </div>

      <div className="record-fields">
        {Object.entries(record).map(([key, val]) => (
          <div key={key} className="record-field">
            <span className="field-key">{getLabel(key)}</span>
            <span className="field-val">
              {BADGE_COLUMNS.has(key)
                ? <SeverityBadge value={val} />
                : val === '' ? <em className="null-val">null</em> : String(val)}
            </span>
          </div>
        ))}
      </div>

      {/* ── NVD Enrichment Section ── */}
      {cveId && (
        <div className="nvd-section">
          {!nvdData && !nvdLoading && (
            <button className="nvd-fetch-btn" onClick={handleFetchNvd} disabled={nvdLoading}>
              <ExternalLink size={13} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
              Fetch Live CVE Data
            </button>
          )}

          {nvdLoading && (
            <div className="nvd-loading">
              <Loader size={13} className="spin" />
              Fetching {cveId} from NIST NVD…
            </div>
          )}

          {nvdError && (
            <div className="explain-error">
              <AlertCircle size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
              {nvdError}
              {record?.VulnName && (
                <div style={{ marginTop: 8 }}>
                  <a
                    href={`https://nvd.nist.gov/vuln/search/results?query=${encodeURIComponent(record.VulnName)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--cyan)', fontSize: '0.78rem' }}
                  >
                    Search NVD for "{record.VulnName}" →
                  </a>
                </div>
              )}
            </div>
          )}

          {nvdData && (
            <div className="nvd-card">
              <div className="nvd-card-header">
                <span className="nvd-cve-id">{nvdData.id || cveId}</span>
                {cvssMetrics?.baseScore !== null && cvssMetrics?.baseScore !== undefined && (
                  <span
                    className="nvd-score-badge"
                    style={{
                      background: cvssMetrics.baseScore >= 9 ? 'rgba(248,113,113,0.15)' :
                                  cvssMetrics.baseScore >= 7 ? 'rgba(251,191,36,0.15)'  :
                                  cvssMetrics.baseScore >= 4 ? 'rgba(96,165,250,0.15)'  : 'rgba(52,211,153,0.15)',
                      color:      cvssMetrics.baseScore >= 9 ? '#f87171' :
                                  cvssMetrics.baseScore >= 7 ? '#fbbf24'  :
                                  cvssMetrics.baseScore >= 4 ? '#60a5fa'  : '#34d399',
                    }}
                  >
                    CVSS {cvssMetrics.version}: {cvssMetrics.baseScore}
                    {cvssMetrics.baseSeverity && ` · ${cvssMetrics.baseSeverity}`}
                  </span>
                )}
              </div>

              {cvssMetrics?.vectorString && (
                <div className="nvd-vector">{cvssMetrics.vectorString}</div>
              )}

              <div className="nvd-published">
                Published: {formatNvdDate(nvdData.published)}
              </div>

              {truncatedDesc && (
                <div className="nvd-desc">{truncatedDesc}</div>
              )}

              <a
                className="nvd-link"
                href={`https://nvd.nist.gov/vuln/detail/${nvdData.id || cveId}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                View on NVD
                <ExternalLink size={11} style={{ display: 'inline', marginLeft: 4, verticalAlign: 'middle' }} />
              </a>
            </div>
          )}
        </div>
      )}

      {/* ── AI Explain Section ── */}
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
