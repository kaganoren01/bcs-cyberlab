// Financial risk estimation engine
// Methodology inspired by Splunk SOAR's risk quantification approach:
// each asset/incident/SLA breach is assigned a risk score weighted by
// severity and time exposure, then converted to a dollar estimate using
// configurable industry benchmark rates.
//
// Default rates sourced from:
//   - IBM Cost of a Data Breach Report 2024 (incident severity benchmarks)
//   - Ponemon Institute CISO Benchmark Study (vuln exposure daily rates)
//   - Standard MSSP contract language (SLA breach hourly penalty)

export const DEFAULT_RATES = {
  incident: {
    Critical: 250000,
    High:      85000,
    Medium:    22000,
    Low:        5000,
  },
  // Per day an unpatched vulnerability remains open on an active asset
  vulnDaily: {
    Critical: 750,
    High:     225,
    Medium:    55,
    Low:       10,
  },
  // Per hour an SLA is in breach (typical MSSP contract penalty rate)
  slaHourly: 1200,
};

function parseDate(str) {
  if (!str || str === '') return null;
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

const SEV_ORDER = { Critical: 0, High: 1, Medium: 2, Low: 3 };
const bySevSort = (a, b) => (SEV_ORDER[a.severity] ?? 9) - (SEV_ORDER[b.severity] ?? 9);

// ── 1. Incident exposure ──────────────────────────────────────
// Each incident is assigned a benchmark cost based on its severity.
// Counts both open and resolved — resolved breaches have already occurred.
export function calcIncidentExposure(incidents, incidentRates) {
  const bySev = {};

  incidents.forEach(inc => {
    const sev = inc.IncidentSeverity || 'Unknown';
    if (!bySev[sev]) bySev[sev] = { count: 0, cost: 0 };
    bySev[sev].count++;
    bySev[sev].cost += incidentRates[sev] ?? 0;
  });

  const rows = Object.entries(bySev)
    .map(([severity, d]) => ({ severity, ...d }))
    .sort(bySevSort);

  const total = rows.reduce((s, r) => s + r.cost, 0);
  const openCost = incidents
    .filter(i => i.IncidentStatus !== 'Closed' && i.IncidentStatus !== 'Resolved')
    .reduce((s, i) => s + (incidentRates[i.IncidentSeverity] ?? 0), 0);

  return { total, openCost, rows };
}

// ── 2. SLA breach penalty ────────────────────────────────────
// For each incident that exceeded its SLA MTTR target, calculates
// the hours of breach and multiplies by the hourly penalty rate.
// Mirrors how Splunk SOAR's SLA cost modeling works — breach time
// (delta between actual vs contracted MTTR) drives the dollar figure.
export function calcSLABreachCost(incidents, slaContracts, hourlyRate, clientMap) {
  const slaMap = {};
  slaContracts.forEach(s => {
    const key = `${s.ClientID}|${s.SLA_SeverityLevel}`;
    slaMap[key] = parseInt(s.SLA_TargetMTTR_Minutes, 10);
  });

  let total = 0;
  const byClient = {};
  const bySev = {};

  incidents.forEach(inc => {
    const opened   = parseDate(inc.IncidentOpenedTime);
    const resolved = parseDate(inc.IncidentResolvedTime);
    if (!opened || !resolved) return;

    const actualMTTR   = (resolved - opened) / 60000; // minutes
    const key          = `${inc.ClientID}|${inc.IncidentSeverity}`;
    const target       = slaMap[key];
    if (target === undefined || isNaN(target)) return;

    const breachMins = Math.max(0, actualMTTR - target);
    if (breachMins <= 0) return;

    const cost = (breachMins / 60) * hourlyRate;
    total += cost;

    const clientName = clientMap[inc.ClientID] || `Client ${inc.ClientID}`;
    byClient[clientName] = (byClient[clientName] || 0) + cost;

    const sev = inc.IncidentSeverity || 'Unknown';
    if (!bySev[sev]) bySev[sev] = { breachCount: 0, cost: 0 };
    bySev[sev].breachCount++;
    bySev[sev].cost += cost;
  });

  const topClients = Object.entries(byClient)
    .map(([name, cost]) => ({ name, cost }))
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 5);

  const bySevRows = Object.entries(bySev)
    .map(([severity, d]) => ({ severity, ...d }))
    .sort(bySevSort);

  return { total, topClients, bySevRows };
}

// ── 3. Vulnerability risk exposure ──────────────────────────
// For each unpatched asset-vulnerability, computes days since first
// detection × daily risk rate for that severity. This follows the
// FAIR (Factor Analysis of Information Risk) model — time at risk
// multiplied by estimated loss exposure per day.
export function calcVulnExposure(assetVulns, vulns, vulnDailyRates) {
  const vulnSevMap = {};
  vulns.forEach(v => { vulnSevMap[v.VulnID] = v.VulnSeverity; });

  const today = new Date();
  let total = 0;
  const bySev = {};

  assetVulns.forEach(av => {
    if (av.AssetVulnStatus === 'Remediated') return;
    const severity = vulnSevMap[av.VulnID] || 'Unknown';
    const detected = parseDate(av.AssetVulnFirstDetectedDate);
    if (!detected) return;

    const daysOpen = Math.max(1, (today - detected) / 86400000);
    const dailyRate = vulnDailyRates[severity] ?? 0;
    const cost = daysOpen * dailyRate;

    if (!bySev[severity]) bySev[severity] = { count: 0, totalDays: 0, cost: 0 };
    bySev[severity].count++;
    bySev[severity].totalDays += daysOpen;
    bySev[severity].cost += cost;
    total += cost;
  });

  const rows = Object.entries(bySev)
    .map(([severity, d]) => ({
      severity,
      count:   d.count,
      avgDays: Math.round(d.totalDays / d.count),
      cost:    d.cost,
    }))
    .sort(bySevSort);

  return { total, rows };
}

// ── Formatting helper ────────────────────────────────────────
export function fmtDollars(n) {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${Math.round(n).toLocaleString()}`;
}
