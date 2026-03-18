import { useState, useMemo } from 'react';
import { DollarSign, ChevronDown, ChevronUp, AlertTriangle, ExternalLink } from 'lucide-react';
import { useTableData } from '../hooks/useTableData';
import { TABLES } from '../utils/schema';
import {
  calcIncidentExposure,
  calcSLABreachCost,
  calcVulnExposure,
  fmtDollars,
  DEFAULT_RATES,
} from '../utils/financialAnalysis';

const SEV_COLORS = { Critical: '#f87171', High: '#fbbf24', Medium: '#60a5fa', Low: '#34d399' };

function RateInput({ label, value, onChange, prefix = '$', suffix = '' }) {
  return (
    <div className="rate-input-row">
      <span className="rate-label">{label}</span>
      <div className="rate-input-wrap">
        <span className="rate-prefix">{prefix}</span>
        <input
          type="number"
          className="rate-input"
          value={value}
          min={0}
          onChange={e => onChange(Number(e.target.value))}
        />
        {suffix && <span className="rate-suffix">{suffix}</span>}
      </div>
    </div>
  );
}

function ExposureCard({ label, value, sub, color, note }) {
  return (
    <div className="fin-card" style={{ '--fin-color': color }}>
      <div className="fin-card-value">{value}</div>
      <div className="fin-card-label">{label}</div>
      {sub  && <div className="fin-card-sub">{sub}</div>}
      {note && <div className="fin-card-note">{note}</div>}
    </div>
  );
}

export default function FinancialImpact() {
  const { data: incidents    } = useTableData('INCIDENT',          TABLES.INCIDENT.file);
  const { data: slaContracts } = useTableData('SLA_CONTRACT',      TABLES.SLA_CONTRACT.file);
  const { data: assetVulns   } = useTableData('ASSET_VULNERABILITY',TABLES.ASSET_VULNERABILITY.file);
  const { data: vulns        } = useTableData('VULNERABILITY',     TABLES.VULNERABILITY.file);
  const { data: clients      } = useTableData('CLIENT',            TABLES.CLIENT.file);

  const [showRates, setShowRates] = useState(false);
  const [incRates,  setIncRates]  = useState({ ...DEFAULT_RATES.incident });
  const [vulnRates, setVulnRates] = useState({ ...DEFAULT_RATES.vulnDaily });
  const [slaRate,   setSlaRate]   = useState(DEFAULT_RATES.slaHourly);

  const clientMap = useMemo(() => {
    const m = {};
    clients.forEach(c => { m[c.ClientID] = c.ClientName || `Client ${c.ClientID}`; });
    return m;
  }, [clients]);

  const incExp  = useMemo(() => calcIncidentExposure(incidents, incRates),                                [incidents, incRates]);
  const slaExp  = useMemo(() => calcSLABreachCost(incidents, slaContracts, slaRate, clientMap),           [incidents, slaContracts, slaRate, clientMap]);
  const vulnExp = useMemo(() => calcVulnExposure(assetVulns, vulns, vulnRates),                           [assetVulns, vulns, vulnRates]);

  const totalExposure = incExp.total + slaExp.total + vulnExp.total;

  function updateIncRate(sev, val)  { setIncRates(r  => ({ ...r,  [sev]: val })); }
  function updateVulnRate(sev, val) { setVulnRates(r => ({ ...r, [sev]: val })); }

  return (
    <section className="analytics-section fin-section">

      {/* Header */}
      <div className="analytics-section-header">
        <DollarSign size={16} />
        <h2>Financial Risk Analysis</h2>
      </div>

      {/* Methodology note */}
      <div className="fin-methodology">
        <AlertTriangle size={13} style={{ flexShrink: 0, color: 'var(--yellow)' }} />
        <span>
          These are <strong>estimated figures</strong> based on industry benchmark rates, not
          realized dollar amounts. Methodology inspired by{' '}
          <a
            href="https://www.splunk.com/en_us/blog/security/risk-based-alerting.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            Splunk SOAR's risk quantification approach
            <ExternalLink size={11} style={{ display: 'inline', marginLeft: 3, verticalAlign: 'middle' }} />
          </a>
          {' '}and the FAIR model. Incident costs from{' '}
          <a
            href="https://www.ibm.com/reports/data-breach"
            target="_blank"
            rel="noopener noreferrer"
          >
            IBM Cost of a Data Breach Report 2024
            <ExternalLink size={11} style={{ display: 'inline', marginLeft: 3, verticalAlign: 'middle' }} />
          </a>
          {'. '}Adjust the rates below to fit your assumptions.
        </span>
      </div>

      {/* Total exposure + 3 category cards */}
      <div className="fin-total-card">
        <div className="fin-total-label">Combined Risk Exposure Estimate</div>
        <div className="fin-total-value">{fmtDollars(totalExposure)}</div>
        <div className="fin-total-sub">Incident exposure + SLA breach penalties + Vulnerability risk</div>
      </div>

      <div className="fin-cards-row">
        <ExposureCard
          label="Incident Exposure"
          value={fmtDollars(incExp.total)}
          sub={`${incidents.length.toLocaleString()} incidents × severity rate`}
          note={`${fmtDollars(incExp.openCost)} from still-open incidents`}
          color="var(--red)"
        />
        <ExposureCard
          label="SLA Breach Penalties"
          value={fmtDollars(slaExp.total)}
          sub={`Hours over contracted MTTR × $${slaRate.toLocaleString()}/hr`}
          color="var(--yellow)"
        />
        <ExposureCard
          label="Vulnerability Risk Exposure"
          value={fmtDollars(vulnExp.total)}
          sub="Unpatched vulns × days open × daily rate"
          color="var(--purple)"
        />
      </div>

      {/* Incident breakdown by severity */}
      <div className="analytics-card">
        <div className="analytics-card-title">Incident Cost Breakdown by Severity</div>
        <table className="analytics-table">
          <thead>
            <tr>
              <th>Severity</th>
              <th>Incidents</th>
              <th>Rate / Incident</th>
              <th>Estimated Cost</th>
              <th style={{ width: 120 }}></th>
            </tr>
          </thead>
          <tbody>
            {incExp.rows.map(row => (
              <tr key={row.severity}>
                <td>
                  <span className="sev-dot" style={{ background: SEV_COLORS[row.severity] ?? '#8b949e' }} />
                  {row.severity}
                </td>
                <td>{row.count.toLocaleString()}</td>
                <td className="mono">{fmtDollars(incRates[row.severity] ?? 0)}</td>
                <td className="mono" style={{ color: SEV_COLORS[row.severity] ?? 'var(--text)', fontWeight: 600 }}>
                  {fmtDollars(row.cost)}
                </td>
                <td>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${(row.cost / incExp.total) * 100}%`, background: SEV_COLORS[row.severity] ?? '#8b949e' }} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* SLA breach — top clients */}
      <div className="analytics-grid-2">
        <div className="analytics-card">
          <div className="analytics-card-title">SLA Breach Cost — Top Clients</div>
          {slaExp.topClients.length === 0 ? (
            <div className="analytics-empty">No SLA breach data found</div>
          ) : (
            <table className="analytics-table">
              <thead><tr><th>#</th><th>Client</th><th>Est. Penalty</th><th style={{ width: 100 }}></th></tr></thead>
              <tbody>
                {slaExp.topClients.map((row, i) => (
                  <tr key={row.name}>
                    <td className="rank">{i + 1}</td>
                    <td>{row.name}</td>
                    <td className="mono" style={{ color: 'var(--yellow)', fontWeight: 600 }}>{fmtDollars(row.cost)}</td>
                    <td>
                      <div className="bar-track">
                        <div className="bar-fill" style={{ width: `${(row.cost / slaExp.topClients[0].cost) * 100}%`, background: 'var(--yellow)' }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="analytics-card">
          <div className="analytics-card-title">SLA Breach Cost by Severity</div>
          {slaExp.bySevRows.length === 0 ? (
            <div className="analytics-empty">No SLA breach data found</div>
          ) : (
            <table className="analytics-table">
              <thead><tr><th>Severity</th><th>Breaches</th><th>Est. Penalty</th></tr></thead>
              <tbody>
                {slaExp.bySevRows.map(row => (
                  <tr key={row.severity}>
                    <td>
                      <span className="sev-dot" style={{ background: SEV_COLORS[row.severity] ?? '#8b949e' }} />
                      {row.severity}
                    </td>
                    <td>{row.breachCount.toLocaleString()}</td>
                    <td className="mono" style={{ color: SEV_COLORS[row.severity] ?? 'var(--text)', fontWeight: 600 }}>
                      {fmtDollars(row.cost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Vuln exposure breakdown */}
      <div className="analytics-card">
        <div className="analytics-card-title">Vulnerability Risk Exposure by Severity</div>
        <table className="analytics-table">
          <thead>
            <tr>
              <th>Severity</th>
              <th>Unpatched Vulns</th>
              <th>Avg Days Open</th>
              <th>Daily Rate</th>
              <th>Est. Exposure</th>
              <th style={{ width: 120 }}></th>
            </tr>
          </thead>
          <tbody>
            {vulnExp.rows.map(row => (
              <tr key={row.severity}>
                <td>
                  <span className="sev-dot" style={{ background: SEV_COLORS[row.severity] ?? '#8b949e' }} />
                  {row.severity}
                </td>
                <td>{row.count.toLocaleString()}</td>
                <td className="mono">{row.avgDays.toLocaleString()}d</td>
                <td className="mono">{fmtDollars(vulnRates[row.severity] ?? 0)}/day</td>
                <td className="mono" style={{ color: SEV_COLORS[row.severity] ?? 'var(--text)', fontWeight: 600 }}>
                  {fmtDollars(row.cost)}
                </td>
                <td>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${(row.cost / vulnExp.total) * 100}%`, background: SEV_COLORS[row.severity] ?? '#8b949e' }} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cost assumptions panel */}
      <div className="fin-assumptions">
        <button className="fin-assumptions-toggle" onClick={() => setShowRates(r => !r)}>
          Customize Cost Assumptions
          {showRates ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {showRates && (
          <div className="fin-assumptions-body">
            <div className="fin-assumptions-grid">
              <div className="fin-rate-group">
                <div className="fin-rate-group-title">Incident Cost by Severity</div>
                <div className="fin-rate-group-hint">Estimated total impact per incident (IBM 2024 benchmark-derived)</div>
                {['Critical', 'High', 'Medium', 'Low'].map(sev => (
                  <RateInput
                    key={sev}
                    label={sev}
                    value={incRates[sev]}
                    onChange={val => updateIncRate(sev, val)}
                  />
                ))}
              </div>
              <div className="fin-rate-group">
                <div className="fin-rate-group-title">Vulnerability Daily Risk Rate</div>
                <div className="fin-rate-group-hint">Cost per day an unpatched vuln remains open (FAIR model-derived)</div>
                {['Critical', 'High', 'Medium', 'Low'].map(sev => (
                  <RateInput
                    key={sev}
                    label={sev}
                    value={vulnRates[sev]}
                    onChange={val => updateVulnRate(sev, val)}
                    suffix="/day"
                  />
                ))}
              </div>
              <div className="fin-rate-group">
                <div className="fin-rate-group-title">SLA Breach Penalty Rate</div>
                <div className="fin-rate-group-hint">Hourly penalty for each hour an incident exceeds its contracted MTTR</div>
                <RateInput
                  label="Per hour of breach"
                  value={slaRate}
                  onChange={setSlaRate}
                  suffix="/hr"
                />
              </div>
            </div>
          </div>
        )}
      </div>

    </section>
  );
}
