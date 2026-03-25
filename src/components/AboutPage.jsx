import { ShieldAlert, Database, Brain, Users, Server, Ticket, Bug, Building2, FileText, GitMerge, Radio, Mail, Github } from 'lucide-react';

const TABLES_OVERVIEW = [
  { icon: ShieldAlert, label: 'Incidents',         desc: 'Security incidents triaged and worked by analysts — severity, status, root cause, impact.' },
  { icon: Brain,       label: 'Alerts',             desc: 'Raw detections from monitoring tools that may or may not escalate into incidents.' },
  { icon: Bug,         label: 'Vulnerabilities',    desc: 'CVEs and findings from scanners, with severity ratings and remediation status.' },
  { icon: Ticket,      label: 'Tickets',            desc: 'Work items tracking investigation and remediation tasks across the team.' },
  { icon: Server,      label: 'Assets',             desc: 'Managed endpoints, servers, and network devices with criticality ratings.' },
  { icon: Building2,   label: 'Clients',            desc: 'The organizations the MSSP provides services to.' },
  { icon: Users,       label: 'Analysts',           desc: 'The SOC team members who own and work incidents and tickets.' },
  { icon: FileText,    label: 'SLA Contracts',      desc: 'Response time commitments made to each client, used to measure compliance.' },
  { icon: Radio,       label: 'Alert Sources',      desc: 'The tools generating alerts — SIEM, EDR, IDS, cloud platforms, etc.' },
  { icon: GitMerge,    label: 'Junction Tables',    desc: 'Asset-Vulnerability, Ticket-Analyst, Incident-Asset links modeling real-world many-to-many relationships.' },
];

const STACK = [
  { name: 'React 18', color: '#58a6ff' },
  { name: 'Vite',     color: '#bc8cff' },
  { name: 'Recharts', color: '#3fb950' },
  { name: 'Netlify',  color: '#d29922' },
  { name: 'Neon DB',  color: '#58a6ff' },
  { name: 'Claude AI', color: '#f85149' },
];

export default function AboutPage() {
  return (
    <div className="about-page">

      <div className="about-hero">
        <div className="about-badge">About This Project</div>
        <h1 className="about-title">Cyber Dataset Analytics</h1>
        <p className="about-lead">
          A real-data training environment built on anonymized operational logs from a
          Managed Security Service Provider. Designed for students and early-career analysts
          who want hands-on experience with the kind of data they'll see on day one of a SOC job.
        </p>
      </div>

      <div className="about-grid">

        <div className="about-card">
          <h2 className="about-card-title">What is an MSSP?</h2>
          <p>
            A <strong>Managed Security Service Provider (MSSP)</strong> is a company that
            monitors and manages cybersecurity for other organizations — handling their
            incident detection, alert triage, vulnerability tracking, and compliance reporting
            around the clock.
          </p>
          <p>
            Think of it as outsourced SOC operations. Instead of each company running its own
            24/7 security team, they contract an MSSP that watches dozens of clients at once
            using shared tooling and specialized analysts.
          </p>
          <p>
            The data in this app reflects exactly that model: multiple client organizations,
            shared analyst teams, SLA commitments, and the full incident lifecycle from
            first alert to closed ticket.
          </p>
        </div>

        <div className="about-card">
          <h2 className="about-card-title">About the Dataset</h2>
          <p>
            The data was collected from a real MSSP environment and fully anonymized —
            client names, analyst names, IP addresses, and hostnames have all been
            replaced or removed. What remains is the <em>structure</em> and
            <em> operational patterns</em> of real security operations work.
          </p>
          <p>
            13 relational tables. Thousands of rows. The same schema a working SOC
            analyst would query every day.
          </p>
          <div className="about-stat-row">
            <div className="about-stat"><span className="about-stat-n">13</span>Tables</div>
            <div className="about-stat"><span className="about-stat-n">100k+</span>Rows</div>
            <div className="about-stat"><span className="about-stat-n">100%</span>Anonymized</div>
          </div>
        </div>

        <div className="about-card about-card-full">
          <h2 className="about-card-title">What's in the Data</h2>
          <div className="about-tables-grid">
            {TABLES_OVERVIEW.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="about-table-row">
                <Icon size={15} className="about-table-icon" />
                <div>
                  <div className="about-table-label">{label}</div>
                  <div className="about-table-desc">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="about-card">
          <h2 className="about-card-title">Why It Was Built</h2>
          <p>
            Most cybersecurity courses teach concepts in isolation — CIA triad,
            attack stages, log formats. What they rarely provide is a realistic
            dataset to practice with.
          </p>
          <p>
            This project exists to fill that gap. Real analysts learn by asking
            questions of real data: which clients have the most unresolved critical
            vulnerabilities? Which analysts close tickets fastest? Are SLA commitments
            being met?
          </p>
          <p>
            The AI explanation feature adds an instructor layer — click any record
            and get a plain-English breakdown of what it means in a real SOC context,
            what an analyst should act on, and what follow-up questions it raises.
          </p>
        </div>

        <div className="about-card">
          <h2 className="about-card-title">About the Author</h2>
          <p>
            Built by <strong>Oren Kagan</strong>, a cybersecurity student at Belmont University
            with hands-on experience in SOC operations. This project was designed to bridge the
            gap between classroom theory and the real-world data that analysts work with daily.
          </p>
          <div className="about-contact">
            <Mail size={13} />
            <a href="mailto:oren.kagan@bruins.belmont.edu">oren.kagan@bruins.belmont.edu</a>
          </div>
          <div className="about-contact">
            <Github size={13} />
            <a href="https://github.com/kaganoren01/bcs-cyberlab" target="_blank" rel="noopener noreferrer">github.com/kaganoren01/bcs-cyberlab</a>
          </div>
        </div>

        <div className="about-card">
          <h2 className="about-card-title">Built With</h2>
          <div className="about-stack">
            {STACK.map(({ name, color }) => (
              <span key={name} className="about-stack-tag" style={{ '--tag-color': color }}>
                {name}
              </span>
            ))}
          </div>
          <p style={{ marginTop: 16 }}>
            Frontend built with React and Vite, hosted on Netlify. Data stored as
            static CSV files — no backend needed for browsing. Authentication and
            settings use Neon serverless PostgreSQL via Netlify Functions. AI
            explanations stream in real time via the Claude API.
          </p>
        </div>

      </div>
    </div>
  );
}
