import { useMemo } from 'react';
import { Users, MapPin, AlertTriangle } from 'lucide-react';
import { useTableData } from '../hooks/useTableData';
import { TABLES } from '../utils/schema';
import { calcClientRiskScores, calcIndustrySummary, calcLocationStats } from '../utils/analytics';
import { SectionHeader, TopNTable, RefBanner } from './AnalyticsShared';
import TableSkeleton from './TableSkeleton';

const SOURCES = [
  { name: 'FAIR Institute Risk Quantification', url: 'https://www.fairinstitute.org/' },
  { name: 'Verizon Data Breach Investigations Report', url: 'https://www.verizon.com/business/resources/reports/dbir/' },
  { name: 'MSSP Alert Client Health Dashboards' },
];

function riskColor(score) {
  if (score > 70) return 'var(--red)';
  if (score > 40) return 'var(--yellow)';
  return 'var(--green)';
}

function critRateColor(pct) {
  if (pct > 30) return 'var(--red)';
  if (pct > 15) return 'var(--yellow)';
  return 'var(--green)';
}

export default function AnalyticsClientRisk() {
  const { data: incidents,    loading: l1 } = useTableData('INCIDENT',           TABLES.INCIDENT.file);
  const { data: assetVulns,   loading: l2 } = useTableData('ASSET_VULNERABILITY', TABLES.ASSET_VULNERABILITY.file);
  const { data: vulns,        loading: l3 } = useTableData('VULNERABILITY',      TABLES.VULNERABILITY.file);
  const { data: assets,       loading: l4 } = useTableData('ASSET',              TABLES.ASSET.file);
  const { data: clients,      loading: l5 } = useTableData('CLIENT',             TABLES.CLIENT.file);
  const { data: slaContracts, loading: l6 } = useTableData('SLA_CONTRACT',       TABLES.SLA_CONTRACT.file);
  const { data: alerts,       loading: l7 } = useTableData('ALERT',              TABLES.ALERT.file);

  const loading = l1 || l2 || l3 || l4 || l5 || l6 || l7;

  const clientRisk   = useMemo(() => calcClientRiskScores(incidents, assetVulns, vulns, assets, clients, slaContracts), [incidents, assetVulns, vulns, assets, clients, slaContracts]);
  const industrySumm = useMemo(() => calcIndustrySummary(incidents, clients),                                            [incidents, clients]);
  const loc          = useMemo(() => calcLocationStats(incidents, alerts, assets, clients),                              [incidents, alerts, assets, clients]);

  if (loading) return <TableSkeleton label="Client Risk" />;

  return (
    <>
      <RefBanner sources={SOURCES} />

      {/* ── Client Risk Scores ── */}
      <section className="analytics-section">
        <SectionHeader icon={Users} title="Client Risk Scores" />

        <div className="analytics-card" style={{ marginBottom: 12 }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--text)' }}>Methodology: </strong>
            Composite score (0–100) combining: critical vuln density (40%), SLA breach rate (30%), critical incident rate (30%).
            Modeled after the FAIR risk quantification framework.
          </div>
        </div>

        <div className="analytics-card">
          <div className="analytics-card-title">Top 10 Riskiest Clients</div>
          {clientRisk.length === 0 ? (
            <div className="analytics-empty">No client risk data available</div>
          ) : (
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Client</th>
                  <th>Industry</th>
                  <th>Size</th>
                  <th>Assets</th>
                  <th>Critical Vulns</th>
                  <th>SLA Breach %</th>
                  <th>Crit. Incident %</th>
                  <th>Risk Score</th>
                </tr>
              </thead>
              <tbody>
                {clientRisk.map((row, i) => (
                  <tr key={row.clientId}>
                    <td className="rank">{i + 1}</td>
                    <td style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {row.name}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{row.industry}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{row.size}</td>
                    <td>{row.assets.toLocaleString()}</td>
                    <td style={{ color: '#f87171' }}>{row.critVulns.toLocaleString()}</td>
                    <td style={{ color: row.slaBreachRate > 30 ? 'var(--red)' : row.slaBreachRate > 15 ? 'var(--yellow)' : 'var(--green)', fontWeight: 600 }}>
                      {row.slaBreachRate}%
                    </td>
                    <td style={{ color: critRateColor(row.critIncidentRate), fontWeight: 600 }}>
                      {row.critIncidentRate}%
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="risk-score-pill" style={{ color: riskColor(row.riskScore), fontWeight: 700, minWidth: 30 }}>
                          {row.riskScore}
                        </span>
                        <div className="bar-track" style={{ flex: 1, maxWidth: 80 }}>
                          <div
                            className="bar-fill"
                            style={{
                              width: `${Math.min(row.riskScore, 100)}%`,
                              background: riskColor(row.riskScore),
                            }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* ── Industry Breakdown ── */}
      <section className="analytics-section">
        <SectionHeader icon={AlertTriangle} title="Industry Breakdown" />

        <div className="analytics-card">
          <div className="analytics-card-title">Incidents by Industry</div>
          {industrySumm.length === 0 ? (
            <div className="analytics-empty">No industry data available</div>
          ) : (
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>Industry</th>
                  <th>Total Incidents</th>
                  <th>Critical</th>
                  <th>High</th>
                  <th>Critical Rate %</th>
                </tr>
              </thead>
              <tbody>
                {industrySumm.map(row => (
                  <tr key={row.industry}>
                    <td>{row.industry}</td>
                    <td>{row.total.toLocaleString()}</td>
                    <td style={{ color: '#f87171' }}>{row.critical.toLocaleString()}</td>
                    <td style={{ color: '#fbbf24' }}>{row.high.toLocaleString()}</td>
                    <td>
                      <span style={{ color: critRateColor(row.criticalRate), fontWeight: 600 }}>
                        {row.criticalRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div style={{ marginTop: 10, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Compare with Verizon DBIR for industry-specific breach rates.
          </div>
        </div>
      </section>

      {/* ── Geographic Distribution ── */}
      <section className="analytics-section">
        <SectionHeader icon={MapPin} title="Geographic Distribution" />
        <div className="analytics-grid-2">
          <div className="analytics-card">
            <div className="analytics-card-title">Top Cities by Incident Count</div>
            <TopNTable rows={loc.incidentsByLocation} />
          </div>
          <div className="analytics-card">
            <div className="analytics-card-title">Top Cities by Alert Volume</div>
            <TopNTable rows={loc.alertsByLocation} />
          </div>
          <div className="analytics-card">
            <div className="analytics-card-title">Top States by Incident Count</div>
            <TopNTable rows={loc.incidentsByState} />
          </div>
        </div>
      </section>
    </>
  );
}
