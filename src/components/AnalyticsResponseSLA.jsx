import { useMemo } from 'react';
import { Clock, ShieldCheck } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useTableData } from '../hooks/useTableData';
import { TABLES } from '../utils/schema';
import { calcResponseTimes, calcSLACompliance } from '../utils/analytics';
import { SEV_COLORS, CustomTooltip, SectionHeader, MetricCard, RefBanner } from './AnalyticsShared';
import TableSkeleton from './TableSkeleton';

const SOURCES = [
  { name: 'NIST SP 800-61 Rev. 3', url: 'https://www.nist.gov/publications/computer-security-incident-handling-guide' },
  { name: 'SANS Incident Response Lifecycle' },
  { name: 'MTTA/MTTR Incident Management KPIs', url: 'https://taskcallapp.com/blog/incident-management-kpis-metrics-that-matter' },
];

export default function AnalyticsResponseSLA() {
  const { data: incidents,    loading: l1 } = useTableData('INCIDENT',     TABLES.INCIDENT.file);
  const { data: slaContracts, loading: l2 } = useTableData('SLA_CONTRACT', TABLES.SLA_CONTRACT.file);

  const loading = l1 || l2;

  const rt  = useMemo(() => calcResponseTimes(incidents),                [incidents]);
  const sla = useMemo(() => calcSLACompliance(incidents, slaContracts),  [incidents, slaContracts]);

  if (loading) return <TableSkeleton label="Response & SLA" />;

  const slaChartData = sla.bySeverity.map(r => ({
    name: r.severity,
    Met: r.met,
    Breached: r.breached,
  }));

  return (
    <>
      <RefBanner sources={SOURCES} />

      {/* ── Response Times ── */}
      <section className="analytics-section">
        <SectionHeader icon={Clock} title="Incident Response Times" />

        <div className="metrics-row">
          <MetricCard
            label="Avg MTTA (Overall)"
            value={rt.fmtMinutes(rt.overall.avgMTTA)}
            sub="Mean Time to Acknowledge"
            color="var(--blue)"
          />
          <MetricCard
            label="Avg MTTR (Overall)"
            value={rt.fmtMinutes(rt.overall.avgMTTR)}
            sub="Mean Time to Resolve"
            color="var(--purple)"
          />
          <MetricCard
            label="Incidents Analyzed"
            value={rt.overall.count.toLocaleString()}
            sub="with valid timestamps"
            color="var(--green)"
          />
        </div>

        <div className="analytics-card">
          <div className="analytics-card-title">MTTA &amp; MTTR by Severity</div>
          <table className="analytics-table">
            <thead>
              <tr>
                <th>Severity</th>
                <th>Incidents</th>
                <th>Avg MTTA</th>
                <th>Avg MTTR</th>
              </tr>
            </thead>
            <tbody>
              {rt.bySeverity.map(row => (
                <tr key={row.severity}>
                  <td>
                    <span className="sev-dot" style={{ background: SEV_COLORS[row.severity] ?? '#8b949e' }} />
                    {row.severity}
                  </td>
                  <td>{row.count.toLocaleString()}</td>
                  <td className="mono">{rt.fmtMinutes(row.avgMTTA)}</td>
                  <td className="mono">{rt.fmtMinutes(row.avgMTTR)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── SLA Compliance ── */}
      <section className="analytics-section">
        <SectionHeader icon={ShieldCheck} title="SLA Compliance" />

        <div className="metrics-row">
          <MetricCard
            label="Overall Compliance Rate"
            value={sla.pct !== null ? `${sla.pct}%` : 'N/A'}
            sub={`${sla.met.toLocaleString()} met / ${sla.breached.toLocaleString()} breached`}
            color={sla.pct >= 80 ? 'var(--green)' : sla.pct >= 60 ? 'var(--yellow)' : 'var(--red)'}
          />
          <MetricCard label="SLA Met"      value={sla.met.toLocaleString()}      color="var(--green)" />
          <MetricCard label="SLA Breached" value={sla.breached.toLocaleString()}  color="var(--red)"   />
          <MetricCard label="No SLA Data"  value={sla.noSLA.toLocaleString()}     color="var(--text-muted)" />
        </div>

        <div className="analytics-card">
          <div className="analytics-card-title">SLA Compliance by Severity</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={slaChartData} margin={{ top: 4, right: 8, left: -20, bottom: 4 }}>
              <XAxis dataKey="name" tick={{ fill: '#8b949e', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#8b949e', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="Met"      fill="#34d399" radius={[4, 4, 0, 0]} stackId="a" />
              <Bar dataKey="Breached" fill="#f87171" radius={[4, 4, 0, 0]} stackId="a" />
            </BarChart>
          </ResponsiveContainer>
          <table className="analytics-table" style={{ marginTop: 12 }}>
            <thead>
              <tr>
                <th>Severity</th>
                <th>Met</th>
                <th>Breached</th>
                <th>Compliance %</th>
              </tr>
            </thead>
            <tbody>
              {sla.bySeverity.map(row => (
                <tr key={row.severity}>
                  <td>
                    <span className="sev-dot" style={{ background: SEV_COLORS[row.severity] ?? '#8b949e' }} />
                    {row.severity}
                  </td>
                  <td style={{ color: 'var(--green)' }}>{row.met.toLocaleString()}</td>
                  <td style={{ color: 'var(--red)' }}>{row.breached.toLocaleString()}</td>
                  <td>
                    {row.pct !== null ? (
                      <span style={{ color: row.pct >= 80 ? 'var(--green)' : row.pct >= 60 ? 'var(--yellow)' : 'var(--red)', fontWeight: 600 }}>
                        {row.pct}%
                      </span>
                    ) : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
