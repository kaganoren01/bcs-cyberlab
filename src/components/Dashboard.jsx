import { useMemo } from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  ShieldAlert, Ticket, Bug, Server,
  Users, FileWarning, Activity, BookOpen,
  ChevronRight, Database, Brain, BarChart2,
} from 'lucide-react';
import { useTableData } from '../hooks/useTableData';
import { TABLES } from '../utils/schema';

const SEV_COLORS = {
  Critical: '#f85149',
  High:     '#e3932a',
  Medium:   '#d29922',
  Low:      '#3fb950',
  Info:     '#58a6ff',
};

const STATUS_COLORS = ['#58a6ff', '#d29922', '#3fb950', '#8b949e', '#bc8cff'];

function aggregate(data, field) {
  const counts = {};
  data.forEach(row => {
    const val = row[field] || 'Unknown';
    counts[val] = (counts[val] || 0) + 1;
  });
  return Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

function StatCard({ icon: Icon, label, value, color, onClick }) {
  return (
    <button className="stat-card" onClick={onClick} style={{ '--card-color': color }}>
      <div className="stat-icon"><Icon size={20} /></div>
      <div className="stat-info">
        <div className="stat-value">{typeof value === 'number' ? value.toLocaleString() : value}</div>
        <div className="stat-label">{label}</div>
      </div>
      <ChevronRight size={14} className="stat-arrow" />
    </button>
  );
}

function ChartCard({ title, children, loading }) {
  return (
    <div className="chart-card">
      <div className="chart-title">{title}</div>
      {loading
        ? <div className="chart-loading">Loading data...</div>
        : children}
    </div>
  );
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#21262d', border: '1px solid #30363d', borderRadius: 6, padding: '8px 12px', fontSize: '0.78rem' }}>
      <strong style={{ color: '#e6edf3' }}>{payload[0].name}</strong>
      <div style={{ color: '#8b949e' }}>{payload[0].value.toLocaleString()} records</div>
    </div>
  );
};

export default function Dashboard({ onNavigate }) {
  const { data: incidents, loading: iLoad } = useTableData('INCIDENT', TABLES.INCIDENT.file);
  const { data: tickets,   loading: tLoad } = useTableData('TICKET',   TABLES.TICKET.file);
  const { data: vulns,     loading: vLoad } = useTableData('VULNERABILITY', TABLES.VULNERABILITY.file);
  const { data: assets  } = useTableData('ASSET',   TABLES.ASSET.file);
  const { data: analysts} = useTableData('ANALYST', TABLES.ANALYST.file);
  const { data: alerts  } = useTableData('ALERT',   TABLES.ALERT.file);

  const incidentBySeverity = useMemo(() => aggregate(incidents, 'IncidentSeverity'), [incidents]);
  const incidentByStatus   = useMemo(() => aggregate(incidents, 'IncidentStatus'),   [incidents]);
  const vulnBySeverity     = useMemo(() => aggregate(vulns,     'VulnSeverity'),     [vulns]);

  const stats = [
    { icon: ShieldAlert, label: 'Incidents',      value: incidents.length, color: '#f85149', table: 'INCIDENT'      },
    { icon: Ticket,      label: 'Tickets',         value: tickets.length,   color: '#58a6ff', table: 'TICKET'        },
    { icon: Bug,         label: 'Vulnerabilities', value: vulns.length,     color: '#e3932a', table: 'VULNERABILITY'  },
    { icon: Server,      label: 'Assets',           value: assets.length,    color: '#3fb950', table: 'ASSET'         },
    { icon: Activity,    label: 'Alerts',           value: alerts.length,    color: '#d29922', table: 'ALERT'         },
    { icon: Users,       label: 'Analysts',         value: analysts.length,  color: '#bc8cff', table: 'ANALYST'       },
  ];

  const features = [
    { icon: Database,  title: 'Real Operational Data',  desc: '13 relational tables modeled after a real MSSP environment — incidents, tickets, SLAs, assets, vulnerabilities, and more.' },
    { icon: Brain,     title: 'AI-Powered Explanations', desc: 'Click any record and get an instant explanation from Claude AI written for cybersecurity students and analysts.' },
    { icon: BarChart2, title: 'Live Data Exploration',   desc: 'Search, filter, and paginate across 100k+ rows of anonymized security operations data — no setup required.' },
    { icon: BookOpen,  title: 'SOC & IR Training',       desc: 'Designed to teach incident response workflow, vulnerability management, SLA compliance, and analyst triage.' },
  ];

  return (
    <div className="dashboard">

      {/* Hero */}
      <div className="dash-hero">
        <div className="dash-hero-inner">
          <div className="dash-badge">Cybersecurity Operations</div>
          <h1 className="dash-title">
            <span className="dash-title-accent">BCS</span> CyberLab
          </h1>
          <p className="dash-subtitle">
            An interactive training dataset from a Managed Security Service Provider (MSSP).
            Explore real-world security operations data and use AI to learn what it all means.
          </p>
          <div className="dash-cta-row">
            <button className="dash-cta-primary" onClick={() => onNavigate('INCIDENT')}>
              Explore Incidents <ChevronRight size={16} />
            </button>
            <button className="dash-cta-secondary" onClick={() => onNavigate('VULNERABILITY')}>
              Browse Vulnerabilities
            </button>
          </div>
          <div className="dash-stack">
            {['React', 'Vite', 'Claude AI', 'Recharts', 'Netlify'].map(t => (
              <span key={t} className="stack-tag">{t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="dash-section">
        <div className="dash-section-label">Dataset Overview</div>
        <div className="stats-grid">
          {stats.map(s => (
            <StatCard key={s.table} {...s} onClick={() => onNavigate(s.table)} />
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="dash-section">
        <div className="dash-section-label">Data at a Glance</div>
        <div className="charts-grid">
          <ChartCard title="Incident Severity Distribution" loading={iLoad}>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={incidentBySeverity} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                  {incidentBySeverity.map((entry) => (
                    <Cell key={entry.name} fill={SEV_COLORS[entry.name] ?? '#8b949e'} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Incident Status Breakdown" loading={iLoad}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={incidentByStatus} margin={{ top: 4, right: 8, left: -20, bottom: 4 }}>
                <XAxis dataKey="name" tick={{ fill: '#8b949e', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#8b949e', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {incidentByStatus.map((_, i) => (
                    <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Vulnerability Severity" loading={vLoad}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={vulnBySeverity} layout="vertical" margin={{ top: 4, right: 8, left: 20, bottom: 4 }}>
                <XAxis type="number" tick={{ fill: '#8b949e', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#8b949e', fontSize: 11 }} axisLine={false} tickLine={false} width={70} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {vulnBySeverity.map((entry) => (
                    <Cell key={entry.name} fill={SEV_COLORS[entry.name] ?? '#8b949e'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>

      {/* Features */}
      <div className="dash-section">
        <div className="dash-section-label">What You'll Learn</div>
        <div className="features-grid">
          {features.map(f => (
            <div key={f.title} className="feature-card">
              <div className="feature-icon"><f.icon size={18} /></div>
              <div>
                <div className="feature-title">{f.title}</div>
                <div className="feature-desc">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
