// Display labels for columns — PKs and FKs intentionally omitted (keep original names)
export const COLUMN_LABELS = {
  // INCIDENT
  IncidentOpenedTime:         'Opened Time',
  IncidentAcknowledgedTime:   'Acknowledged',
  IncidentResolvedTime:       'Resolved Time',
  IncidentSeverity:           'Severity',
  IncidentCategory:           'Category',
  IncidentStatus:             'Status',
  IncidentRootCause:          'Root Cause',
  IncidentImpactSummary:      'Impact Summary',
  // ALERT
  AlertTime:                  'Time',
  AlertSeverity:              'Severity',
  AlertCategory:              'Category',
  AlertDescription:           'Description',
  AlertIsEscalatedToIncident: 'Escalated',
  // ALERT_SOURCE
  AlertSourceName:            'Source Name',
  // ANALYST (FN+LN merged separately into 'Name')
  AnalystEmail:               'Email',
  AnalystRole:                'Role',
  AnalystStudentStatus:       'Student Status',
  AnalystIsActive:            'Active',
  // ASSET
  AssetName:                  'Name',
  AssetType:                  'Type',
  AssetEnvironment:           'Environment',
  AssetBusinessCriticality:   'Business Criticality',
  AssetIPAddressOrHostname:   'IP / Hostname',
  AssetStatus:                'Status',
  // ASSET_VULNERABILITY
  AssetVulnFirstDetectedDate: 'First Detected',
  AssetVulnLastDetectedDate:  'Last Detected',
  AssetVulnStatus:            'Status',
  AssetVulnRemediatedDate:    'Remediated Date',
  // CLIENT
  ClientName:                 'Name',
  ClientIndustry:             'Industry',
  ClientSizeCategory:         'Size',
  ClientCity:                 'City',
  ClientState:                'State',
  ClientIsActive:             'Active',
  // CLIENT_CONTACT (FN+LN merged separately into 'Name')
  ContactEmail:               'Email',
  ContactPhone:               'Phone',
  ContactRoleTitle:           'Role',
  IsPrimaryContact:           'Primary Contact',
  // VULNERABILITY
  VulnName:                   'Name',
  VulnDescription:            'Description',
  VulnSeverity:               'Severity',
  VulnSource:                 'Source',
  VulnCVE:                    'CVE',
  VulnMitigationSummary:      'Mitigation',
  // SLA_CONTRACT
  SLA_Name:                   'Name',
  SLA_SeverityLevel:          'Severity Level',
  SLA_TargetMTTA_Minutes:     'Target MTTA (min)',
  SLA_TargetMTTR_Minutes:     'Target MTTR (min)',
  SLA_EffectiveStartDate:     'Start Date',
  SLA_EffectiveEndDate:       'End Date',
  // TICKET
  TicketOpenedTime:           'Opened Time',
  TicketClosedTime:           'Closed Time',
  TicketPriority:             'Priority',
  TicketCurrentStatus:        'Status',
  TicketTitle:                'Title',
  TicketDescription:          'Description',
  // TICKET_ANALYST
  TA_AssignTime:              'Assigned Time',
  TA_RoleOnTicket:            'Role',
  TA_EscalationLevel:         'Escalation Level',
  // INCIDENT_ASSET
  IncAssetRoleInIncident:     'Role',
};

// Tables where first+last name should be merged into a single 'Name' column
const NAME_MERGE = {
  ANALYST:        { first: 'AnalystFirstName',  last: 'AnalystLastName'  },
  CLIENT_CONTACT: { first: 'ContactFirstName',  last: 'ContactLastName'  },
};

export function getLabel(col) {
  return COLUMN_LABELS[col] ?? col;
}

// Merges FN+LN columns into 'Name' at the position of the first-name column
export function transformRows(tableKey, rows) {
  const merge = NAME_MERGE[tableKey];
  if (!merge || !rows.length) return rows;
  return rows.map(row => {
    const result = {};
    for (const [key, val] of Object.entries(row)) {
      if (key === merge.first) {
        result['Name'] = [row[merge.first], row[merge.last]].filter(Boolean).join(' ');
      } else if (key === merge.last) {
        // skip — already merged above
      } else {
        result[key] = val;
      }
    }
    return result;
  });
}
