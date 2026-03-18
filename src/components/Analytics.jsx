import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie,
} from 'recharts';
import { Clock, MapPin, ShieldCheck, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useTableData } from '../hooks/useTableData';
import { TABLES } from '../utils/schema';
import {
  calcResponseTimes,
  calcLocationStats,
  calcSLACompliance,
  calcMiscStats,
} from '../utils/analytics';
import FinancialImpact from './FinancialImpact';

const SEV_COLORS = { Critical: '#f85149', High: '#e3932a', Medium: '#d29922', Low: '#3fb950' };
const BAR_COLORS = ['#58a6ff', '#bc8cff', '#3fb950', '#d29922', '#f85149'];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#21262d', border: '1px solid #30363d', borderRadius: 6, padding: '8px 12px', fontSize: '0.78rem' }}>
      <strong style={{ color: '#e6edf3' }}>{payload[0].name || payload[0].payload?.name}</strong>
      <div style={{ color: '#8b949e' }}>{payload[0].value?.toLocaleString()}</div>
    </div>
  );
};

function SectionHeader({ icon: Icon, title }) {
  return (
    <div className="analytics-section-header">
      <Icon size={16} />
      <h2>{title}</h2>
    </div>
  );
}

function MetricCard({ label, value, sub, color }) {
  return (
    <div className="metric-card" style={{ '--mc-color': color ?? 'var(--blue)' }}>
      <div className="metric-value">{value}</div>
      <div className="metric-label">{label}</div>
      {sub && <div className="metric-sub">{sub}</div>}
    </div>
  );
}

function TopNTable({ rows, valueLabel = 'Count' }) {
  if (!rows?.length) return <div className="analytics-empty">No data</div>;
  const max = rows[0].value;
  return (
    <table className="analytics-table">
      <thead><tr><th>#</th><th>Name</th><th>{valueLabel}</th><th style={{ width: 120 }}></th></tr></thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={row.name}>
            <td className="rank">{i + 1}</td>
            <td>{row.name}</td>
            <td>{row.value.toLocaleString()}</td>
            <td>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${(row.value / max) * 100}%`, background: BAR_COLORS[i % BAR_COLORS.length] }} />
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Loading() {
  return <div className="analytics-loading">Loading data...</div>;
}

export default function Analytics() {
  const { data: incidents,   loading: l1 } = useTableData('INCIDENT',         TABLES.INCIDENT.file);
  const { data: alerts,      loading: l2 } = useTableData('ALERT',             TABLES.ALERT.file);
  const { data: clients,     loading: l3 } = useTableData('CLIENT',            TABLES.CLIENT.file);
  const { data: assets,      loading: l4 } = useTableData('ASSET',             TABLES.ASSET.file);
  const { data: slaContracts,loading: l5 } = useTableData('SLA_CONTRACT',      TABLES.SLA_CONTRACT.file);
  const { data: tickets,     loading: l6 } = useTableData('TICKET',            TABLES.TICKET.file);
  const { data: assetVulns,  loading: l7 } = useTableData('ASSET_VULNERABILITY',TABLES.ASSET_VULNERABILITY.file);

  const loading = l1 || l2 || l3 || l4 || l5 || l6 || l7;

  const rt   = useMemo(() => calcResponseTimes(incidents),                            [incidents]);
  const loc  = useMemo(() => calcLocationStats(incidents, alerts, assets, clients),   [incidents, alerts, assets, clients]);
  const sla  = useMemo(() => calcSLACompliance(incidents, slaContracts),              [incidents, slaContracts]);
  const misc = useMemo(() => calcMiscStats(incidents, alerts, tickets, assetVulns, clients), [incidents, alerts, tickets, assetVulns, clients]);

  if (loading) return <Loading />;

  const slaChartData = sla.bySeverity.map(r => ({
    name: r.severity,
    Met: r.met,
    Breached: r.breached,
  }));

  return (
    <div className="analytics-page">

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
              <tr><th>Severity</th><th>Incidents</th><th>Avg MTTA</th><th>Avg MTTR</th></tr>
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

      {/* ── Location ── */}
      <section className="analytics-section">
        <SectionHeader icon={MapPin} title="Geographic Breakdown" />
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
          <div className="analytics-card">
            <div className="analytics-card-title">Top Clients by Incident Count</div>
            <TopNTable rows={misc.topClients} />
          </div>
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
              <Bar dataKey="Met"      fill="#3fb950" radius={[4,4,0,0]} stackId="a" />
              <Bar dataKey="Breached" fill="#f85149" radius={[4,4,0,0]} stackId="a" />
            </BarChart>
          </ResponsiveContainer>
          <table className="analytics-table" style={{ marginTop: 12 }}>
            <thead><tr><th>Severity</th><th>Met</th><th>Breached</th><th>Compliance %</th></tr></thead>
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

      {/* ── Misc Stats ── */}
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

      {/* ── Financial Impact ── */}
      <FinancialImpact />

    </div>
  );
}
