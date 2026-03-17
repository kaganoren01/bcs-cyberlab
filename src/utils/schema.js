// Table definitions derived from BCS Data Dictionary
// Each entry defines display name, file path, key column, and teaching context

export const TABLES = {
  INCIDENT: {
    label: 'Incidents',
    file: '/data/INCIDENT.csv',
    primaryKey: 'IncidentID',
    description: 'Security incidents opened for clients — the core of IR workflow.',
    columns: ['IncidentID','ClientID','IncidentOpenedTime','IncidentAcknowledgedTime','IncidentResolvedTime','IncidentSeverity','IncidentCategory','IncidentStatus','IncidentRootCause','IncidentImpactSummary'],
  },
  ALERT: {
    label: 'Alerts',
    file: '/data/ALERT.csv',
    primaryKey: 'AlertID',
    description: 'Security alerts from monitoring tools, some escalated to incidents.',
    columns: ['AlertID','AssetID','AlertSourceID','AlertTime','AlertSeverity','AlertCategory','AlertDescription','IncidentID','AlertIsEscalatedToIncident'],
  },
  VULNERABILITY: {
    label: 'Vulnerabilities',
    file: '/data/VULNERABILITY.csv',
    primaryKey: 'VulnID',
    description: 'CVE and vulnerability records with severity and mitigation guidance.',
    columns: ['VulnID','VulnName','VulnDescription','VulnSeverity','VulnSource','VulnCVE','VulnMitigationSummary'],
  },
  TICKET: {
    label: 'Tickets',
    file: '/data/TICKET.csv',
    primaryKey: 'TicketID',
    description: 'Support tickets linked to clients and incidents.',
    columns: ['TicketID','ClientID','IncidentID','TicketOpenedTime','TicketClosedTime','TicketPriority','TicketCurrentStatus','TicketTitle','TicketDescription'],
    filterBy: { field: 'TicketCurrentStatus', label: 'Status' },
  },
  ASSET: {
    label: 'Assets',
    file: '/data/ASSET.csv',
    primaryKey: 'AssetID',
    description: 'Client-owned assets being monitored and protected.',
    columns: ['AssetID','ClientID','AssetName','AssetType','AssetEnvironment','AssetBusinessCriticality','AssetIPAddressOrHostname','AssetStatus'],
  },
  ASSET_VULNERABILITY: {
    label: 'Asset Vulnerabilities',
    file: '/data/ASSET_VULNERABILITY.csv',
    primaryKey: 'AssetVulnID',
    description: 'Which vulnerabilities affect which assets, and their remediation status.',
    columns: ['AssetVulnID','AssetID','VulnID','AssetVulnFirstDetectedDate','AssetVulnLastDetectedDate','AssetVulnStatus','AssetVulnRemediatedDate'],
  },
  ANALYST: {
    label: 'Analysts',
    file: '/data/ANALYST.csv',
    primaryKey: 'AnalystID',
    description: 'SOC analysts and their roles within the team.',
    columns: ['AnalystID','Name','AnalystEmail','AnalystRole','AnalystStudentStatus','AnalystIsActive'],
  },
  CLIENT: {
    label: 'Clients',
    file: '/data/CLIENT.csv',
    primaryKey: 'ClientID',
    description: 'Organizations whose environments are being protected.',
    columns: ['ClientID','ClientName','ClientIndustry','ClientSizeCategory','ClientCity','ClientState','ClientIsActive'],
  },
  SLA_CONTRACT: {
    label: 'SLA Contracts',
    file: '/data/SLA_CONTRACT.csv',
    primaryKey: 'SLA_ContractID',
    description: 'Service level agreements — target MTTA/MTTR by severity.',
    columns: ['SLA_ContractID','ClientID','SLA_Name','SLA_SeverityLevel','SLA_TargetMTTA_Minutes','SLA_TargetMTTR_Minutes','SLA_EffectiveStartDate','SLA_EffectiveEndDate'],
  },
  ALERT_SOURCE: {
    label: 'Alert Sources',
    file: '/data/ALERT_SOURCE.csv',
    primaryKey: 'AlertSourceID',
    description: 'Tools and systems that generate alerts (SIEM, EDR, IDS, etc.).',
    columns: ['AlertSourceID','AlertSourceName','Description'],
  },
  TICKET_ANALYST: {
    label: 'Ticket Assignments',
    file: '/data/TICKET_ANALYST.csv',
    primaryKey: 'TA_ID',
    description: 'Which analysts are assigned to which tickets and at what escalation level.',
    columns: ['TA_ID','TicketID','AnalystID','TA_AssignTime','TA_RoleOnTicket','TA_EscalationLevel'],
  },
  INCIDENT_ASSET: {
    label: 'Incident Assets',
    file: '/data/INCIDENT_ASSET.csv',
    primaryKey: 'IncAssetID',
    description: 'Assets involved in each incident and their role.',
    columns: ['IncAssetID','IncidentID','AssetID','IncAssetRoleInIncident'],
  },
  CLIENT_CONTACT: {
    label: 'Client Contacts',
    file: '/data/CLIENT_CONTACT.csv',
    primaryKey: 'ContactID',
    description: 'Points of contact at each client organization.',
    columns: ['ContactID','ClientID','Name','ContactEmail','ContactPhone','ContactRoleTitle','IsPrimaryContact'],
  },
};

// Tables shown prominently in the main nav (core teaching tables)
export const PRIMARY_TABLES = ['INCIDENT', 'ALERT', 'VULNERABILITY', 'TICKET'];
// Tables shown in a secondary "Reference" section
export const REFERENCE_TABLES = ['ASSET', 'ASSET_VULNERABILITY', 'ANALYST', 'CLIENT', 'SLA_CONTRACT', 'ALERT_SOURCE', 'TICKET_ANALYST', 'INCIDENT_ASSET', 'CLIENT_CONTACT'];
