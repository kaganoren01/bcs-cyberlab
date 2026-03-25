import { useMemo } from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  ShieldAlert, Ticket, Bug, Server,
  Users, Activity, ChevronRight, Database, Brain, BarChart2, BookOpen,
} from 'lucide-react';
import { useTableData } from '../hooks/useTableData';
import { TABLES } from '../utils/schema';
import { useInView } from '../hooks/useIntersectionObserver';
import { useCounter } from '../hooks/useCounter';

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

function StatCard({ icon: Icon, label, value, color, onClick, index }) {
  const [ref, visible] = useInView();
  const count = useCounter(value, 1400, visible);
  return (
    <button
      ref={ref}
      className={`stat-card ${visible ? 'in-view' : ''}`}
      onClick={onClick}
      style={{ '--card-color': color, '--delay': `${index * 80}ms` }}
    >
      <div className="stat-icon"><Icon size={20} /></div>
      <div className="stat-info">
        <div className="stat-value">{count.toLocaleString()}</div>
        <div className="stat-label">{label}</div>
      </div>
      <ChevronRight size={14} className="stat-arrow" />
    </button>
  );
}

function ChartCard({ title, children, loading, accent }) {
  const [ref, visible] = useInView();
  return (
    <div
      ref={ref}
      className={`chart-card ${visible ? 'in-view' : ''}`}
      style={{ '--chart-accent': accent ?? 'var(--cyan)' }}
    >
      <div className="chart-title">
        <span className="chart-title-dot" />
        {title}
      </div>
      {loading
        ? <div className="chart-loading"><span className="chart-loading-bar" /></div>
        : children}
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc, index }) {
  const [ref, visible] = useInView();
  return (
    <div
      ref={ref}
      className={`feature-card ${visible ? 'in-view' : ''}`}
      style={{ '--delay': `${index * 100}ms` }}
    >
      <div className="feature-icon"><Icon size={18} /></div>
      <div>
        <div className="feature-title">{title}</div>
        <div className="feature-desc">{desc}</div>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#0a1120', border: '1px solid #1e2d44', borderRadius: 8, padding: '8px 12px', fontSize: '0.78rem' }}>
      <strong style={{ color: '#e2e8f0' }}>{payload[0].name}</strong>
      <div style={{ color: '#64748b' }}>{payload[0].value.toLocaleString()} records</div>
    </div>
  );
};

export default function Dashboard({ onNavigate }) {
  const { data: incidents, loading: iLoad } = useTableData('INCIDENT',      TABLES.INCIDENT.file);
  const { data: tickets                   } = useTableData('TICKET',        TABLES.TICKET.file);
  const { data: vulns,     loading: vLoad } = useTableData('VULNERABILITY', TABLES.VULNERABILITY.file);
  const { data: assets  }                   = useTableData('ASSET',         TABLES.ASSET.file);
  const { data: analysts}                   = useTableData('ANALYST',       TABLES.ANALYST.file);
  const { data: alerts  }                   = useTableData('ALERT',         TABLES.ALERT.file);

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
    { icon: Database,  title: 'Real Operational Data',  desc: "Sourced from a working MSSP and fully anonymized — same schema, same relationships, same chaos you'd find on day one of a SOC job." },
    { icon: Brain,     title: 'Ask AI What It Means',    desc: "Click any record for a plain-English breakdown: what an analyst would act on, what's suspicious, and why it matters." },
    { icon: BarChart2, title: 'Filter, Search, Explore', desc: 'Client filters, status dropdowns, full-text search across every column. No setup, no SQL required.' },
    { icon: BookOpen,  title: 'Learn by Doing',          desc: 'Incident triage, vuln prioritization, SLA tracking, analyst workload — the things interviews ask about, in actual data.' },
  ];

  const [heroRef, heroVisible] = useInView();
  const [statsLabelRef, statsLabelVisible] = useInView();

  return (
    <div className="dashboard">

      {/* Hero */}
      <div ref={heroRef} className={`dash-hero ${heroVisible ? 'in-view' : ''}`}>
        <div className="hero-grid" />
        <div className="hero-scanline" />
        <div className="dash-hero-inner">
          <div className="dash-badge">
            <span className="badge-pulse" />
            Real MSSP Data. No Textbook Fluff.
          </div>
          <h1 className="dash-title">
            <span className="dash-title-accent">Cyber</span> Dataset Analytics
          </h1>
          <p className="dash-subtitle">
            13 tables. 100k+ rows. One MSSP worth of real incidents, tickets, vulnerabilities,
            and SLA commitments — fully anonymized, fully explorable, explained by AI when you need it.
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
        <div ref={statsLabelRef} className={`dash-section-label ${statsLabelVisible ? 'in-view' : ''}`}>
          Dataset Overview
        </div>
        <div className="stats-grid">
          {stats.map((s, i) => (
            <StatCard key={s.table} {...s} index={i} onClick={() => onNavigate(s.table)} />
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="dash-section">
        <div className="dash-section-label">Data at a Glance</div>
        <div className="charts-grid">
          <ChartCard title="Incident Severity" loading={iLoad} accent="#f85149">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={incidentBySeverity} dataKey="value" nameKey="name"
                  cx="50%" cy="50%" outerRadius={80} innerRadius={30}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false} fontSize={11}>
                  {incidentBySeverity.map((entry) => (
                    <Cell key={entry.name} fill={SEV_COLORS[entry.name] ?? '#8b949e'} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Incident Status" loading={iLoad} accent="#58a6ff">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={incidentByStatus} margin={{ top: 4, right: 8, left: -20, bottom: 4 }}>
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {incidentByStatus.map((_, i) => (
                    <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Vulnerability Severity" loading={vLoad} accent="#e3932a">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={vulnBySeverity} layout="vertical" margin={{ top: 4, right: 8, left: 20, bottom: 4 }}>
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} width={70} />
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
        <div className="dash-section-label">What You will Learn</div>
        <div className="features-grid">
          {features.map((f, i) => (
            <FeatureCard key={f.title} {...f} index={i} />
          ))}
        </div>
      </div>

    </div>
  );
}
