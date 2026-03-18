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

// ── Vulnerability remediation MTTR ──────────────────────────────────────────
export function calcVulnRemediation(assetVulns, vulns) {
  const SEV_ORDER = { Critical: 0, High: 1, Medium: 2, Low: 3 };

  // Build vulnSevMap: VulnID → severity
  const vulnSevMap = {};
  vulns.forEach(v => { vulnSevMap[v.VulnID] = v.VulnSeverity || 'Unknown'; });

  // Accumulate per severity
  const bySev = {};

  assetVulns.forEach(av => {
    const sev = vulnSevMap[av.VulnID] || 'Unknown';
    if (!bySev[sev]) bySev[sev] = { open: 0, remDays: [] };

    const isRemediated = av.AssetVulnStatus === 'Remediated';
    if (isRemediated) {
      const first = parseDate(av.AssetVulnFirstDetectedDate);
      const remDate = parseDate(av.AssetVulnRemediatedDate);
      if (first && remDate) {
        const days = (remDate - first) / (1000 * 60 * 60 * 24);
        bySev[sev].remDays.push(Math.max(0, days));
      } else {
        // still count it as remediated even without valid dates
        bySev[sev].remDays.push(null);
      }
    } else {
      bySev[sev].open++;
    }
  });

  const median = arr => {
    const valid = arr.filter(x => x !== null).sort((a, b) => a - b);
    if (!valid.length) return null;
    const mid = Math.floor(valid.length / 2);
    return valid.length % 2 === 0 ? (valid[mid - 1] + valid[mid]) / 2 : valid[mid];
  };
  const avg = arr => {
    const valid = arr.filter(x => x !== null);
    if (!valid.length) return null;
    return valid.reduce((a, b) => a + b, 0) / valid.length;
  };

  let totalRemediated = 0;
  let totalOpen = 0;

  const rows = Object.entries(bySev).map(([severity, d]) => {
    const remCount = d.remDays.length;
    const openCount = d.open;
    const total = remCount + openCount;
    const remRate = total > 0 ? Math.round((remCount / total) * 100) : 0;
    const avgDaysToRemediate = avg(d.remDays);
    const medianDaysToRemediate = median(d.remDays);
    totalRemediated += remCount;
    totalOpen += openCount;
    return {
      severity,
      openCount,
      remCount,
      remRate,
      avgDaysToRemediate: avgDaysToRemediate !== null ? Math.round(avgDaysToRemediate) : null,
      medianDaysToRemediate: medianDaysToRemediate !== null ? Math.round(medianDaysToRemediate) : null,
    };
  }).sort((a, b) => (SEV_ORDER[a.severity] ?? 9) - (SEV_ORDER[b.severity] ?? 9));

  const grandTotal = totalRemediated + totalOpen;
  const overallRemRate = grandTotal > 0 ? Math.round((totalRemediated / grandTotal) * 100) : 0;

  return { rows, totalRemediated, totalOpen, overallRemRate };
}

// ── Asset risk scoring ────────────────────────────────────────
export function calcAssetRiskScores(assets, assetVulns, vulns) {
  const SEV_SCORE = { Critical: 40, High: 15, Medium: 5, Low: 1 };
  const CRITICALITY_WEIGHT = { Critical: 3, High: 2, Medium: 1, Low: 0.5 };

  // Build vulnSevMap: VulnID → severity
  const vulnSevMap = {};
  vulns.forEach(v => { vulnSevMap[v.VulnID] = v.VulnSeverity || 'Unknown'; });

  // Build assetMap: AssetID → asset info
  const assetMap = {};
  assets.forEach(a => {
    assetMap[a.AssetID] = {
      assetId: a.AssetID,
      name: a.AssetName || a.AssetIPAddressOrHostname || a.AssetID,
      type: a.AssetType || 'Unknown',
      criticality: a.AssetBusinessCriticality || 'Unknown',
    };
  });

  // Score accumulation per asset
  const scoreMap = {};
  const vulnCountMap = {};

  assetVulns.forEach(av => {
    if (av.AssetVulnStatus === 'Remediated') return;
    const assetId = av.AssetID;
    const sev = vulnSevMap[av.VulnID] || 'Unknown';
    const assetInfo = assetMap[assetId];
    if (!assetInfo) return;

    const criticality = assetInfo.criticality;
    const sevScore = SEV_SCORE[sev] ?? 0;
    const critWeight = CRITICALITY_WEIGHT[criticality] ?? 1;
    const contribution = sevScore * critWeight;

    if (!scoreMap[assetId]) scoreMap[assetId] = 0;
    scoreMap[assetId] += contribution;

    if (!vulnCountMap[assetId]) vulnCountMap[assetId] = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    if (sev in vulnCountMap[assetId]) vulnCountMap[assetId][sev]++;
  });

  const results = Object.entries(scoreMap)
    .filter(([, score]) => score > 0)
    .map(([assetId, score]) => ({
      ...assetMap[assetId],
      score: Math.round(score),
      vulnCounts: vulnCountMap[assetId] || { Critical: 0, High: 0, Medium: 0, Low: 0 },
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  return results;
}

// ── Alert fatigue / noise ratio ──────────────────────────────
export function calcAlertFatigue(alerts, alertSources) {
  // alertSourceMap: AlertSourceID → AlertSourceName
  const alertSourceMap = {};
  alertSources.forEach(s => { alertSourceMap[s.AlertSourceID] = s.AlertSourceName || s.AlertSourceID; });

  const bySrc = {};

  alerts.forEach(a => {
    const srcId = a.AlertSourceID || 'Unknown';
    if (!bySrc[srcId]) bySrc[srcId] = { total: 0, escalated: 0 };
    bySrc[srcId].total++;
    const esc = a.AlertIsEscalatedToIncident;
    if (esc === 'true' || esc === true || esc === 1 || esc === '1') {
      bySrc[srcId].escalated++;
    }
  });

  const rows = Object.entries(bySrc).map(([sourceId, d]) => {
    const actionable = d.escalated;
    const noiseRatio = d.total > 0 ? Math.round(((d.total - d.escalated) / d.total) * 100) : 0;
    return {
      sourceId,
      name: alertSourceMap[sourceId] || sourceId,
      total: d.total,
      escalated: d.escalated,
      actionable,
      noiseRatio,
    };
  }).sort((a, b) => b.total - a.total);

  return rows;
}

// ── Analyst performance ───────────────────────────────────────
export function calcAnalystPerformance(tickets, ticketAnalysts, analysts) {
  // analystMap: AnalystID → { name, role, isStudent }
  const analystMap = {};
  analysts.forEach(a => {
    analystMap[a.AnalystID] = {
      name: a.Name || a.AnalystEmail || a.AnalystID,
      role: a.AnalystRole || 'Unknown',
      isStudent: a.AnalystStudentStatus,
    };
  });

  // ticketMap: TicketID → ticket (for duration)
  const ticketMap = {};
  tickets.forEach(t => { ticketMap[t.TicketID] = t; });

  // Accumulate per analyst
  const byAnalyst = {};

  ticketAnalysts.forEach(ta => {
    const analystId = ta.AnalystID;
    if (!byAnalyst[analystId]) {
      byAnalyst[analystId] = { total: 0, level1: 0, level2Plus: 0, closeDays: [] };
    }
    byAnalyst[analystId].total++;

    const level = ta.TA_EscalationLevel;
    if (level === '1' || level === 1) {
      byAnalyst[analystId].level1++;
    } else {
      byAnalyst[analystId].level2Plus++;
    }

    // Calculate duration for closed tickets
    const ticket = ticketMap[ta.TicketID];
    if (ticket && ticket.TicketCurrentStatus === 'Closed') {
      const opened = parseDate(ticket.TicketOpenedTime);
      const closed = parseDate(ticket.TicketClosedTime);
      if (opened && closed) {
        const days = (closed - opened) / (1000 * 60 * 60 * 24);
        byAnalyst[analystId].closeDays.push(Math.max(0, days));
      }
    }
  });

  const avg = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;

  const rows = Object.entries(byAnalyst).map(([analystId, d]) => {
    const info = analystMap[analystId] || { name: analystId, role: 'Unknown', isStudent: 'No' };
    const escalationPct = d.total > 0 ? Math.round((d.level2Plus / d.total) * 100) : 0;
    const avgCloseDays = avg(d.closeDays);
    return {
      analystId,
      name: info.name,
      role: info.role,
      isStudent: info.isStudent,
      total: d.total,
      level1: d.level1,
      level2Plus: d.level2Plus,
      escalationPct,
      avgCloseDays: avgCloseDays !== null ? +avgCloseDays.toFixed(1) : null,
    };
  }).sort((a, b) => b.total - a.total).slice(0, 15);

  return rows;
}

// ── Client risk scoring ───────────────────────────────────────
export function calcClientRiskScores(incidents, assetVulns, vulns, assets, clients, slaContracts) {
  // Build maps
  const vulnSevMap = {};
  vulns.forEach(v => { vulnSevMap[v.VulnID] = v.VulnSeverity || 'Unknown'; });

  const assetClientMap = {};
  assets.forEach(a => { assetClientMap[a.AssetID] = a.ClientID; });

  const clientAssetCount = {};
  assets.forEach(a => {
    const cid = a.ClientID;
    clientAssetCount[cid] = (clientAssetCount[cid] || 0) + 1;
  });

  const clientMap = {};
  clients.forEach(c => {
    clientMap[c.ClientID] = {
      name: c.ClientName || c.ClientID,
      industry: c.ClientIndustry || 'Unknown',
      size: c.ClientSizeCategory || 'Unknown',
    };
  });

  // Count critical open vulns per client
  const clientCritVulns = {};
  assetVulns.forEach(av => {
    if (av.AssetVulnStatus === 'Remediated') return;
    const sev = vulnSevMap[av.VulnID];
    if (sev !== 'Critical') return;
    const cid = assetClientMap[av.AssetID];
    if (!cid) return;
    clientCritVulns[cid] = (clientCritVulns[cid] || 0) + 1;
  });

  // SLA breach rate per client (same logic as calcSLACompliance)
  const slaMap = {};
  slaContracts.forEach(s => {
    const key = `${s.ClientID}|${s.SLA_SeverityLevel}`;
    slaMap[key] = parseInt(s.SLA_TargetMTTR_Minutes, 10);
  });

  const clientSLA = {};
  incidents.forEach(inc => {
    const mttr = minutesBetween(inc.IncidentOpenedTime, inc.IncidentResolvedTime);
    if (mttr === null) return;
    const key = `${inc.ClientID}|${inc.IncidentSeverity}`;
    const target = slaMap[key];
    if (target === undefined) return;
    const cid = inc.ClientID;
    if (!clientSLA[cid]) clientSLA[cid] = { met: 0, breached: 0 };
    if (mttr <= target) clientSLA[cid].met++;
    else clientSLA[cid].breached++;
  });

  // Critical incident rate per client
  const clientIncidents = {};
  incidents.forEach(inc => {
    const cid = inc.ClientID;
    if (!clientIncidents[cid]) clientIncidents[cid] = { total: 0, critical: 0 };
    clientIncidents[cid].total++;
    if (inc.IncidentSeverity === 'Critical') clientIncidents[cid].critical++;
  });

  // Build raw scores per client
  const clientScores = clients.map(c => {
    const cid = c.ClientID;
    const assetCount = clientAssetCount[cid] || 0;
    const critVulns = clientCritVulns[cid] || 0;
    const critVulnDensity = assetCount > 0 ? critVulns / assetCount : 0;

    const slaData = clientSLA[cid] || { met: 0, breached: 0 };
    const slaTotal = slaData.met + slaData.breached;
    const slaBreachRate = slaTotal > 0 ? slaData.breached / slaTotal : 0;

    const incData = clientIncidents[cid] || { total: 0, critical: 0 };
    const critIncidentRate = incData.total > 0 ? incData.critical / incData.total : 0;

    return {
      clientId: cid,
      name: clientMap[cid]?.name || cid,
      industry: clientMap[cid]?.industry || 'Unknown',
      size: clientMap[cid]?.size || 'Unknown',
      critVulns,
      assets: assetCount,
      slaBreachRate,
      critIncidentRate,
      critVulnDensity,
      totalIncidents: incData.total,
    };
  });

  // Find max density for normalization
  const maxDensity = Math.max(...clientScores.map(c => c.critVulnDensity), 1);

  const scored = clientScores.map(c => ({
    ...c,
    riskScore: Math.round(
      (c.critVulnDensity / maxDensity) * 40 +
      c.slaBreachRate * 30 +
      c.critIncidentRate * 30
    ),
    slaBreachRate: Math.round(c.slaBreachRate * 100),
    critIncidentRate: Math.round(c.critIncidentRate * 100),
  })).sort((a, b) => b.riskScore - a.riskScore).slice(0, 10);

  return scored;
}

// ── Industry incident breakdown ───────────────────────────────
export function calcIndustrySummary(incidents, clients) {
  // clientMap: ClientID → ClientIndustry
  const clientMap = {};
  clients.forEach(c => { clientMap[c.ClientID] = c.ClientIndustry || 'Unknown'; });

  const byIndustry = {};

  incidents.forEach(inc => {
    const industry = clientMap[inc.ClientID] || 'Unknown';
    if (!byIndustry[industry]) byIndustry[industry] = { total: 0, critical: 0, high: 0 };
    byIndustry[industry].total++;
    if (inc.IncidentSeverity === 'Critical') byIndustry[industry].critical++;
    if (inc.IncidentSeverity === 'High') byIndustry[industry].high++;
  });

  return Object.entries(byIndustry).map(([industry, d]) => ({
    industry,
    total: d.total,
    critical: d.critical,
    high: d.high,
    criticalRate: d.total > 0 ? Math.round((d.critical / d.total) * 100) : 0,
  })).sort((a, b) => b.total - a.total);
}
