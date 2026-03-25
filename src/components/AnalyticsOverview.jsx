import { useMemo } from 'react';
import { BarChart2, Clock, ShieldCheck, AlertTriangle, TrendingUp, Users, DollarSign } from 'lucide-react';
import { useTableData } from '../hooks/useTableData';
import { TABLES } from '../utils/schema';
import { calcSLACompliance, calcResponseTimes } from '../utils/analytics';
import TableSkeleton from './TableSkeleton';

function InsightCard({ label, value, benchmark, color, status }) {
  return (
    <div className="insight-card" style={{ '--ic-color': color ?? 'var(--blue)', '--ic-status': status ?? color ?? 'var(--blue)' }}>
      <div className="insight-value" style={{ color: color ?? 'var(--blue)' }}>{value}</div>
      <div className="insight-label">{label}</div>
      {benchmark && <div className="insight-benchmark">{benchmark}</div>}
    </div>
  );
}

const EXPLORE_CARDS = [
  { id: 'response',  label: 'Response & SLA',  icon: Clock,        desc: 'MTTA/MTTR trends and SLA compliance by severity' },
  { id: 'vulns',     label: 'Vulnerabilities', icon: ShieldCheck,  desc: 'Remediation MTTR, asset risk scoring, open CVEs' },
  { id: 'soc',       label: 'SOC Operations',  icon: TrendingUp,   desc: 'Alert fatigue, analyst performance, ticket stats' },
  { id: 'clients',   label: 'Client Risk',     icon: Users,        desc: 'Composite risk scores, industry breakdown, geography' },
  { id: 'financial', label: 'Financial',       icon: DollarSign,   desc: 'Estimated financial exposure across incident types' },
];

export default function AnalyticsOverview({ onTabChange }) {
  const { data: incidents,    loading: l1 } = useTableData('INCIDENT',          TABLES.INCIDENT.file);
  const { data: alerts,       loading: l2 } = useTableData('ALERT',             TABLES.ALERT.file);
  const { data: assetVulns,   loading: l3 } = useTableData('ASSET_VULNERABILITY', TABLES.ASSET_VULNERABILITY.file);
  const { data: slaContracts, loading: l4 } = useTableData('SLA_CONTRACT',      TABLES.SLA_CONTRACT.file);

  const loading = l1 || l2 || l3 || l4;

  const sla  = useMemo(() => calcSLACompliance(incidents, slaContracts), [incidents, slaContracts]);
  const rt   = useMemo(() => calcResponseTimes(incidents),               [incidents]);

  if (loading) return <TableSkeleton label="Overview" />;

  // Alert noise ratio: alerts not escalated / total alerts
  const totalAlerts = alerts.length;
  const escalatedAlerts = alerts.filter(a => {
    const v = a.AlertIsEscalatedToIncident;
    return v === 'true' || v === true || v === 1 || v === '1';
  }).length;
  const noiseRatioPct = totalAlerts > 0 ? Math.round(((totalAlerts - escalatedAlerts) / totalAlerts) * 100) : null;

  // Avg MTTR for critical incidents in hours
  const critRow = rt.bySeverity.find(r => r.severity === 'Critical');
  const critMTTRHours = critRow && critRow.avgMTTR !== null ? (critRow.avgMTTR / 60).toFixed(1) : null;

  // Unpatched critical vulns count
  const unpatchedCritical = assetVulns.filter(av => av.AssetVulnStatus !== 'Remediated').length;

  return (
    <div className="analytics-section">
      <div className="analytics-section-header">
        <BarChart2 size={16} />
        <h2>Security Posture Snapshot</h2>
      </div>

      <div className="insight-grid">
        <InsightCard
          label="SLA Compliance"
          value={sla.pct !== null ? `${sla.pct}%` : 'N/A'}
          benchmark="MSSP industry target: 95%+"
          color={sla.pct !== null ? (sla.pct >= 95 ? 'var(--green)' : sla.pct >= 80 ? 'var(--yellow)' : 'var(--red)') : 'var(--text-muted)'}
        />
        <InsightCard
          label="Alert Noise Ratio"
          value={noiseRatioPct !== null ? `${noiseRatioPct}%` : 'N/A'}
          benchmark="Industry avg ~55% actionable — Splunk State of Security 2023"
          color={noiseRatioPct !== null ? (noiseRatioPct > 80 ? 'var(--red)' : noiseRatioPct > 60 ? 'var(--yellow)' : 'var(--green)') : 'var(--text-muted)'}
        />
        <InsightCard
          label="Avg MTTR — Critical"
          value={critMTTRHours !== null ? `${critMTTRHours}h` : 'N/A'}
          benchmark="NIST SP 800-61: respond within 1hr for critical"
          color={critMTTRHours !== null ? (parseFloat(critMTTRHours) <= 1 ? 'var(--green)' : parseFloat(critMTTRHours) <= 4 ? 'var(--yellow)' : 'var(--red)') : 'var(--text-muted)'}
        />
        <InsightCard
          label="Unpatched Critical Vulns"
          value={unpatchedCritical.toLocaleString()}
          benchmark="Ponemon: avg 60 days to remediate critical vulns"
          color={unpatchedCritical === 0 ? 'var(--green)' : unpatchedCritical < 10 ? 'var(--yellow)' : 'var(--red)'}
        />
        <InsightCard
          label="Total Incidents"
          value={incidents.length.toLocaleString()}
          color="var(--blue)"
        />
        <InsightCard
          label="SLA Breached"
          value={sla.breached.toLocaleString()}
          color={sla.breached === 0 ? 'var(--green)' : sla.breached < 20 ? 'var(--yellow)' : 'var(--red)'}
        />
      </div>

      <div className="analytics-section-header" style={{ marginTop: 32 }}>
        <BarChart2 size={16} />
        <h2>Explore Deeper Analysis</h2>
      </div>
      <div className="explore-tabs-row">
        {EXPLORE_CARDS.map(card => {
          const Icon = card.icon;
          return (
            <button
              key={card.id}
              className="explore-tab-card"
              onClick={() => onTabChange(card.id)}
            >
              <div className="explore-tab-icon"><Icon size={18} /></div>
              <div className="explore-tab-label">{card.label}</div>
              <div className="explore-tab-desc">{card.desc}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
