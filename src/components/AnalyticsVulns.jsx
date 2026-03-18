import { useMemo } from 'react';
import { ShieldCheck, AlertTriangle } from 'lucide-react';
import { useTableData } from '../hooks/useTableData';
import { TABLES } from '../utils/schema';
import { calcVulnRemediation, calcAssetRiskScores } from '../utils/analytics';
import { SEV_COLORS, SectionHeader, MetricCard, RefBanner } from './AnalyticsShared';
import TableSkeleton from './TableSkeleton';

const SOURCES = [
  { name: 'Tenable Vulnerability Management', url: 'https://www.tenable.com/products/tenable-vulnerability-management' },
  { name: 'NIST National Vulnerability Database', url: 'https://nvd.nist.gov/' },
  { name: 'Ponemon Institute Vulnerability Research', url: 'https://www.ponemon.org/' },
];

function riskScoreColor(score) {
  if (score > 100) return 'var(--red)';
  if (score > 50) return 'var(--yellow)';
  return 'var(--green)';
}

export default function AnalyticsVulns() {
  const { data: assetVulns, loading: l1 } = useTableData('ASSET_VULNERABILITY', TABLES.ASSET_VULNERABILITY.file);
  const { data: vulns,      loading: l2 } = useTableData('VULNERABILITY',       TABLES.VULNERABILITY.file);
  const { data: assets,     loading: l3 } = useTableData('ASSET',               TABLES.ASSET.file);

  const loading = l1 || l2 || l3;

  const remData   = useMemo(() => calcVulnRemediation(assetVulns, vulns),          [assetVulns, vulns]);
  const riskAssets = useMemo(() => calcAssetRiskScores(assets, assetVulns, vulns), [assets, assetVulns, vulns]);

  if (loading) return <TableSkeleton label="Vulnerabilities" />;

  return (
    <>
      <RefBanner sources={SOURCES} />

      {/* ── Vuln Remediation ── */}
      <section className="analytics-section">
        <SectionHeader icon={ShieldCheck} title="Vulnerability Remediation" />

        <div className="metrics-row">
          <MetricCard
            label="Total Remediated"
            value={remData.totalRemediated.toLocaleString()}
            color="var(--green)"
          />
          <MetricCard
            label="Total Open"
            value={remData.totalOpen.toLocaleString()}
            color="var(--red)"
          />
          <MetricCard
            label="Overall Rem. Rate"
            value={`${remData.overallRemRate}%`}
            color={remData.overallRemRate >= 70 ? 'var(--green)' : remData.overallRemRate >= 40 ? 'var(--yellow)' : 'var(--red)'}
          />
        </div>

        <div className="analytics-card">
          <div className="analytics-card-title">Vulnerability Remediation MTTR by Severity</div>
          <table className="analytics-table">
            <thead>
              <tr>
                <th>Severity</th>
                <th>Open</th>
                <th>Remediated</th>
                <th>Rem. Rate %</th>
                <th>Avg Days to Fix</th>
                <th>Median Days to Fix</th>
              </tr>
            </thead>
            <tbody>
              {remData.rows.map(row => (
                <tr key={row.severity}>
                  <td>
                    <span className="sev-dot" style={{ background: SEV_COLORS[row.severity] ?? '#8b949e' }} />
                    {row.severity}
                  </td>
                  <td style={{ color: 'var(--red)' }}>{row.openCount.toLocaleString()}</td>
                  <td style={{ color: 'var(--green)' }}>{row.remCount.toLocaleString()}</td>
                  <td>
                    <span style={{ color: row.remRate >= 70 ? 'var(--green)' : row.remRate >= 40 ? 'var(--yellow)' : 'var(--red)', fontWeight: 600 }}>
                      {row.remRate}%
                    </span>
                  </td>
                  <td className="mono">
                    {row.avgDaysToRemediate !== null ? `${row.avgDaysToRemediate}d` : 'N/A'}
                  </td>
                  <td className="mono">
                    {row.medianDaysToRemediate !== null ? `${row.medianDaysToRemediate}d` : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: 10, fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertTriangle size={12} style={{ color: 'var(--yellow)', flexShrink: 0 }} />
            Ponemon benchmark: 60 days for Critical
          </div>
        </div>
      </section>

      {/* ── Asset Risk Scoring ── */}
      <section className="analytics-section">
        <SectionHeader icon={AlertTriangle} title="Asset Risk Scoring" />

        <div className="analytics-card" style={{ marginBottom: 12 }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--text)' }}>Methodology: </strong>
            Score = Σ(severity_weight × criticality_multiplier) per open vulnerability.
            Inspired by CVSS base scoring. Weights: Critical=40, High=15, Medium=5, Low=1.
            Criticality multipliers: Critical×3, High×2, Medium×1, Low×0.5.
          </div>
        </div>

        <div className="analytics-card">
          <div className="analytics-card-title">Top 10 Riskiest Assets</div>
          {riskAssets.length === 0 ? (
            <div className="analytics-empty">No asset risk data available</div>
          ) : (
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Asset Name</th>
                  <th>Type</th>
                  <th>Criticality</th>
                  <th>Risk Score</th>
                  <th>Critical Vulns</th>
                  <th>High Vulns</th>
                </tr>
              </thead>
              <tbody>
                {riskAssets.map((asset, i) => (
                  <tr key={asset.assetId}>
                    <td className="rank">{i + 1}</td>
                    <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {asset.name}
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{asset.type}</td>
                    <td>
                      <span className="sev-dot" style={{ background: SEV_COLORS[asset.criticality] ?? '#8b949e' }} />
                      {asset.criticality}
                    </td>
                    <td>
                      <span className="risk-score-pill" style={{ color: riskScoreColor(asset.score), fontWeight: 700 }}>
                        {asset.score}
                      </span>
                    </td>
                    <td style={{ color: '#f87171' }}>{asset.vulnCounts.Critical}</td>
                    <td style={{ color: '#fbbf24' }}>{asset.vulnCounts.High}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', padding: '0 0 8px', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--blue)' }}>Tip: </strong>
          Click any Vulnerability record in the data tables and use &quot;Fetch Live CVE Data&quot; to enrich with real CVSS scores from NIST NVD.
        </div>
      </section>
    </>
  );
}
