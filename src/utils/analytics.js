// Pure computation helpers for the Analytics page

function parseDate(str) {
  if (!str || str === '') return null;
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

function minutesBetween(a, b) {
  const da = parseDate(a), db = parseDate(b);
  if (!da || !db) return null;
  return (db - da) / 60000;
}

function fmtMinutes(mins) {
  if (mins === null || isNaN(mins)) return 'N/A';
  if (mins < 60)   return `${Math.round(mins)}m`;
  if (mins < 1440) return `${(mins / 60).toFixed(1)}h`;
  return `${(mins / 1440).toFixed(1)}d`;
}

function topN(arr, keyFn, n = 5) {
  const counts = {};
  arr.forEach(item => {
    const k = keyFn(item) || 'Unknown';
    counts[k] = (counts[k] || 0) + 1;
  });
  return Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, n);
}

// ── MTTA / MTTR by severity ──────────────────────────────────
export function calcResponseTimes(incidents) {
  const bySev = {};
  let totalMTTA = [], totalMTTR = [];

  incidents.forEach(inc => {
    const mtta = minutesBetween(inc.IncidentOpenedTime, inc.IncidentAcknowledgedTime);
    const mttr = minutesBetween(inc.IncidentOpenedTime, inc.IncidentResolvedTime);
    const sev  = inc.IncidentSeverity || 'Unknown';

    if (!bySev[sev]) bySev[sev] = { mtta: [], mttr: [] };
    if (mtta !== null) { bySev[sev].mtta.push(mtta); totalMTTA.push(mtta); }
    if (mttr !== null) { bySev[sev].mttr.push(mttr); totalMTTR.push(mttr); }
  });

  const avg = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;

  const rows = Object.entries(bySev).map(([sev, d]) => ({
    severity: sev,
    avgMTTA:  avg(d.mtta),
    avgMTTR:  avg(d.mttr),
    count:    Math.max(d.mtta.length, d.mttr.length),
  })).sort((a, b) => {
    const order = { Critical: 0, High: 1, Medium: 2, Low: 3 };
    return (order[a.severity] ?? 9) - (order[b.severity] ?? 9);
  });

  return {
    overall: { avgMTTA: avg(totalMTTA), avgMTTR: avg(totalMTTR), count: incidents.length },
    bySeverity: rows,
    fmtMinutes,
  };
}

// ── Location analysis ────────────────────────────────────────
export function calcLocationStats(incidents, alerts, assets, clients) {
  const clientMap = {};
  clients.forEach(c => {
    clientMap[c.ClientID] = {
      location: [c.ClientCity, c.ClientState].filter(Boolean).join(', ') || 'Unknown',
      state: c.ClientState || 'Unknown',
    };
  });

  const assetClientMap = {};
  assets.forEach(a => { assetClientMap[a.AssetID] = a.ClientID; });

  const incidentsByLocation = topN(incidents, inc => clientMap[inc.ClientID]?.location);
  const incidentsByState    = topN(incidents, inc => clientMap[inc.ClientID]?.state);
  const alertsByLocation    = topN(alerts,    a   => clientMap[assetClientMap[a.AssetID]]?.location);

  return { incidentsByLocation, incidentsByState, alertsByLocation };
}

// ── SLA compliance ───────────────────────────────────────────
export function calcSLACompliance(incidents, slaContracts) {
  // Build SLA map: clientId + severity → target MTTR in minutes
  const slaMap = {};
  slaContracts.forEach(s => {
    const key = `${s.ClientID}|${s.SLA_SeverityLevel}`;
    slaMap[key] = parseInt(s.SLA_TargetMTTR_Minutes, 10);
  });

  let met = 0, breached = 0, noSLA = 0;
  const bySev = {};

  incidents.forEach(inc => {
    const mttr = minutesBetween(inc.IncidentOpenedTime, inc.IncidentResolvedTime);
    if (mttr === null) return;
    const key = `${inc.ClientID}|${inc.IncidentSeverity}`;
    const target = slaMap[key];
    const sev = inc.IncidentSeverity || 'Unknown';
    if (!bySev[sev]) bySev[sev] = { met: 0, breached: 0 };

    if (target === undefined) { noSLA++; return; }
    if (mttr <= target) { met++; bySev[sev].met++; }
    else                { breached++; bySev[sev].breached++; }
  });

  const total = met + breached;
  const rows = Object.entries(bySev).map(([sev, d]) => ({
    severity: sev,
    met: d.met,
    breached: d.breached,
    pct: d.met + d.breached > 0 ? Math.round(d.met / (d.met + d.breached) * 100) : null,
  })).sort((a, b) => {
    const order = { Critical: 0, High: 1, Medium: 2, Low: 3 };
    return (order[a.severity] ?? 9) - (order[b.severity] ?? 9);
  });

  return { met, breached, noSLA, pct: total > 0 ? Math.round(met / total * 100) : null, bySeverity: rows };
}

// ── Misc top-N stats ─────────────────────────────────────────
export function calcMiscStats(incidents, alerts, tickets, assetVulns, clients) {
  const clientMap = {};
  clients.forEach(c => { clientMap[c.ClientID] = c.ClientName || c.ClientID; });

  return {
    topIncidentCategories: topN(incidents, i => i.IncidentCategory),
    topClients:            topN(incidents, i => clientMap[i.ClientID]),
    topAlertSources:       topN(alerts,    a => a.AlertSourceID),
    topTicketPriorities:   topN(tickets,   t => t.TicketPriority),
    openTickets:           tickets.filter(t => t.TicketCurrentStatus !== 'Closed').length,
    closedTickets:         tickets.filter(t => t.TicketCurrentStatus === 'Closed').length,
    unremediatedVulns:     assetVulns.filter(v => v.AssetVulnStatus !== 'Remediated').length,
    remediatedVulns:       assetVulns.filter(v => v.AssetVulnStatus === 'Remediated').length,
  };
}
