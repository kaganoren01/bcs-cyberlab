import { useMemo } from 'react';
import { Activity, TrendingUp, Users } from 'lucide-react';
import { useTableData } from '../hooks/useTableData';
import { TABLES } from '../utils/schema';
import { calcAlertFatigue, calcAnalystPerformance, calcMiscStats } from '../utils/analytics';
import { SectionHeader, MetricCard, TopNTable, RefBanner } from './AnalyticsShared';
import TableSkeleton from './TableSkeleton';

const SOURCES = [
  { name: 'Splunk SOAR Risk-Based Alerting', url: 'https://www.splunk.com/en_us/blog/security/the-new-improved-splunk-guide-to-risk-based-alerting.html' },
  { name: 'Gartner SOC Visibility Triad' },
  { name: 'MITRE ATT&CK Framework', url: 'https://attack.mitre.org/' },
];

function noiseColor(pct) {
  if (pct > 90) return 'var(--red)';
  if (pct > 70) return 'var(--yellow)';
  return 'var(--green)';
}

export default function AnalyticsSOC() {
  const { data: alerts,         loading: l1 } = useTableData('ALERT',          TABLES.ALERT.file);
  const { data: alertSources,   loading: l2 } = useTableData('ALERT_SOURCE',   TABLES.ALERT_SOURCE.file);
  const { data: tickets,        loading: l3 } = useTableData('TICKET',         TABLES.TICKET.file);
  const { data: ticketAnalysts, loading: l4 } = useTableData('TICKET_ANALYST', TABLES.TICKET_ANALYST.file);
  const { data: analysts,       loading: l5 } = useTableData('ANALYST',        TABLES.ANALYST.file);
  const { data: incidents,      loading: l6 } = useTableData('INCIDENT',       TABLES.INCIDENT.file);
  const { data: assetVulns,     loading: l7 } = useTableData('ASSET_VULNERABILITY', TABLES.ASSET_VULNERABILITY.file);
  const { data: clients,        loading: l8 } = useTableData('CLIENT',         TABLES.CLIENT.file);

  const loading = l1 || l2 || l3 || l4 || l5 || l6 || l7 || l8;

  const fatigue      = useMemo(() => calcAlertFatigue(alerts, alertSources),                  [alerts, alertSources]);
  const analystPerf  = useMemo(() => calcAnalystPerformance(tickets, ticketAnalysts, analysts), [tickets, ticketAnalysts, analysts]);
  const misc         = useMemo(() => calcMiscStats(incidents, alerts, tickets, assetVulns, clients), [incidents, alerts, tickets, assetVulns, clients]);

  if (loading) return <TableSkeleton label="SOC Operations" />;

  const totalAlerts     = fatigue.reduce((s, r) => s + r.total, 0);
  const totalEscalated  = fatigue.reduce((s, r) => s + r.escalated, 0);
  const overallNoise    = totalAlerts > 0 ? Math.round(((totalAlerts - totalEscalated) / totalAlerts) * 100) : 0;

  return (
    <>
      <RefBanner sources={SOURCES} />

      {/* ── Alert Fatigue ── */}
      <section className="analytics-section">
        <SectionHeader icon={Activity} title="Alert Fatigue Analysis" />

        <div className="metrics-row">
          <MetricCard
            label="Total Alerts"
            value={totalAlerts.toLocaleString()}
            color="var(--blue)"
          />
          <MetricCard
            label="Escalated to Incidents"
            value={totalEscalated.toLocaleString()}
            color="var(--purple)"
          />
          <MetricCard
            label="Overall Noise Ratio"
            value={`${overallNoise}%`}
            sub="non-actionable alerts"
            color={noiseColor(overallNoise)}
          />
        </div>

        <div className="analytics-card">
          <div className="analytics-card-title">Alert Noise by Source</div>
          {fatigue.length === 0 ? (
            <div className="analytics-empty">No alert source data</div>
          ) : (
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>Source Name</th>
                  <th>Total Alerts</th>
                  <th>Escalated</th>
                  <th>Actionable %</th>
                  <th>Noise %</th>
                </tr>
              </thead>
              <tbody>
                {fatigue.map(row => {
                  const actionablePct = row.total > 0 ? Math.round((row.actionable / row.total) * 100) : 0;
                  return (
                    <tr key={row.sourceId}>
                      <td>{row.name}</td>
                      <td>{row.total.toLocaleString()}</td>
                      <td>{row.escalated.toLocaleString()}</td>
                      <td style={{ color: actionablePct >= 30 ? 'var(--green)' : 'var(--yellow)', fontWeight: 600 }}>
                        {actionablePct}%
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ color: noiseColor(row.noiseRatio), fontWeight: 600, minWidth: 36 }}>
                            {row.noiseRatio}%
                          </span>
                          <div className="noise-bar">
                            <div
                              className="noise-bar-fill"
                              style={{
                                width: `${row.noiseRatio}%`,
                                background: noiseColor(row.noiseRatio),
                              }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          <div style={{ marginTop: 12, fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            High noise ratio means analysts waste time on false positives.
            Splunk SOAR&apos;s Risk-Based Alerting addresses this by scoring alerts before they page analysts.
          </div>
        </div>
      </section>

      {/* ── Analyst Performance ── */}
      <section className="analytics-section">
        <SectionHeader icon={Users} title="Analyst Performance" />

        <div className="analytics-card">
          <div className="analytics-card-title">Per-Analyst Metrics</div>
          {analystPerf.length === 0 ? (
            <div className="analytics-empty">No analyst assignment data</div>
          ) : (
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>Analyst</th>
                  <th>Role</th>
                  <th>Student</th>
                  <th>Tickets Worked</th>
                  <th>L1 Assignments</th>
                  <th>L2+ (Escalated to)</th>
                  <th>Escalation %</th>
                  <th>Avg Close Time</th>
                </tr>
              </thead>
              <tbody>
                {analystPerf.map(row => {
                  const isStudent = row.isStudent === 'Yes' || row.isStudent === 'true' || row.isStudent === 1 || row.isStudent === '1';
                  return (
                    <tr key={row.analystId}>
                      <td style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {row.name}
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{row.role}</td>
                      <td>
                        {isStudent && (
                          <span className="student-badge">Student</span>
                        )}
                      </td>
                      <td>{row.total.toLocaleString()}</td>
                      <td>{row.level1.toLocaleString()}</td>
                      <td>{row.level2Plus.toLocaleString()}</td>
                      <td style={{ color: row.escalationPct >= 50 ? 'var(--purple)' : 'var(--text-muted)', fontWeight: row.escalationPct >= 50 ? 600 : 400 }}>
                        {row.escalationPct}%
                      </td>
                      <td className="mono">
                        {row.avgCloseDays !== null ? `${row.avgCloseDays}d` : 'N/A'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          <div style={{ marginTop: 10, fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            L2+ escalation % shows how often this analyst receives escalated work — higher means they handle complex cases.
          </div>
        </div>
      </section>

      {/* ── Operational Breakdown ── */}
      <section className="analytics-section">
        <SectionHeader icon={TrendingUp} title="Operational Breakdown" />

        <div className="metrics-row">
          <MetricCard
            label="Open Tickets"
            value={misc.openTickets.toLocaleString()}
            sub="not yet closed"
            color="var(--yellow)"
          />
          <MetricCard
            label="Closed Tickets"
            value={misc.closedTickets.toLocaleString()}
            color="var(--green)"
          />
          <MetricCard
            label="Unremediated Vulns"
            value={misc.unremediatedVulns.toLocaleString()}
            sub="asset exposures"
            color="var(--red)"
          />
          <MetricCard
            label="Remediated Vulns"
            value={misc.remediatedVulns.toLocaleString()}
            color="var(--green)"
          />
        </div>

        <div className="analytics-grid-2">
          <div className="analytics-card">
            <div className="analytics-card-title">Top Incident Categories</div>
            <TopNTable rows={misc.topIncidentCategories} />
          </div>
          <div className="analytics-card">
            <div className="analytics-card-title">Ticket Priority Distribution</div>
            <TopNTable rows={misc.topTicketPriorities} />
          </div>
        </div>
      </section>
    </>
  );
}
