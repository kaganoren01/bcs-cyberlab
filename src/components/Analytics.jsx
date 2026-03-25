import { useState } from 'react';
import AnalyticsOverview from './AnalyticsOverview';
import AnalyticsResponseSLA from './AnalyticsResponseSLA';
import AnalyticsVulns from './AnalyticsVulns';
import AnalyticsSOC from './AnalyticsSOC';
import AnalyticsClientRisk from './AnalyticsClientRisk';
import FinancialImpact from './FinancialImpact';

const TABS = [
  { id: 'overview',  label: 'Overview' },
  { id: 'response',  label: 'Response & SLA' },
  { id: 'vulns',     label: 'Vulnerabilities' },
  { id: 'soc',       label: 'SOC Operations' },
  { id: 'clients',   label: 'Client Risk' },
  { id: 'financial', label: 'Financial' },
];

export default function Analytics() {
  const [tab, setTab] = useState('overview');
  return (
    <div className="analytics-container">
      <div className="analytics-tabs">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`analytics-tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="analytics-tab-content">
        {tab === 'overview'  && <AnalyticsOverview onTabChange={setTab} />}
        {tab === 'response'  && <AnalyticsResponseSLA />}
        {tab === 'vulns'     && <AnalyticsVulns />}
        {tab === 'soc'       && <AnalyticsSOC />}
        {tab === 'clients'   && <AnalyticsClientRisk />}
        {tab === 'financial' && <FinancialImpact />}
      </div>
    </div>
  );
}

