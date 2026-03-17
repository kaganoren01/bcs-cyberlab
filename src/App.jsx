import { useState } from 'react';
import {
  LayoutDashboard, ShieldAlert, Bell, Bug,
  Ticket, Server, Link2, Users, Building2,
  FileText, Radio, GitMerge, UserCheck, ContactRound,
  BarChart2, LogOut,
} from 'lucide-react';
import { TABLES, PRIMARY_TABLES, REFERENCE_TABLES } from './utils/schema';
import Dashboard from './components/Dashboard';
import Analytics from './components/Analytics';
import TableView from './components/TableView';
import LoginPage from './components/LoginPage';
import { useAuth } from './hooks/useAuth';
import './App.css';

const TABLE_ICONS = {
  INCIDENT:         ShieldAlert,
  ALERT:            Bell,
  VULNERABILITY:    Bug,
  TICKET:           Ticket,
  ASSET:            Server,
  ASSET_VULNERABILITY: Link2,
  ANALYST:          Users,
  CLIENT:           Building2,
  SLA_CONTRACT:     FileText,
  ALERT_SOURCE:     Radio,
  TICKET_ANALYST:   GitMerge,
  INCIDENT_ASSET:   UserCheck,
  CLIENT_CONTACT:   ContactRound,
};

export default function App() {
  const { isAuthenticated, email, login, logout } = useAuth();
  const [activeView, setActiveView] = useState('dashboard');

  if (!isAuthenticated) return <LoginPage onLogin={login} />;

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <button className="logo" onClick={() => setActiveView('dashboard')}>
            <span className="logo-bracket">[</span>
            BCS CyberLab
            <span className="logo-bracket">]</span>
          </button>
          <p className="header-sub">MSSP Cybersecurity Operations Training Dataset</p>
        </div>
        <div className="header-user">
          <span className="header-email">{email}</span>
          <button className="logout-btn" onClick={logout} title="Sign out">
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </header>

      <div className="app-body">
        <nav className="sidebar">
          <button
            className={`nav-item nav-dashboard ${activeView === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveView('dashboard')}
          >
            <LayoutDashboard size={15} className="nav-icon" />
            Dashboard
          </button>
          <button
            className={`nav-item nav-dashboard ${activeView === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveView('analytics')}
          >
            <BarChart2 size={15} className="nav-icon" />
            Analytics
          </button>

          <div className="nav-divider" />

          <div className="nav-section">
            <span className="nav-label">Core Tables</span>
            {PRIMARY_TABLES.map(key => {
              const Icon = TABLE_ICONS[key];
              return (
                <button
                  key={key}
                  className={`nav-item ${activeView === key ? 'active' : ''}`}
                  onClick={() => setActiveView(key)}
                >
                  {Icon && <Icon size={14} className="nav-icon" />}
                  {TABLES[key].label}
                </button>
              );
            })}
          </div>

          <div className="nav-section">
            <span className="nav-label">Reference</span>
            {REFERENCE_TABLES.map(key => {
              const Icon = TABLE_ICONS[key];
              return (
                <button
                  key={key}
                  className={`nav-item ${activeView === key ? 'active' : ''}`}
                  onClick={() => setActiveView(key)}
                >
                  {Icon && <Icon size={14} className="nav-icon" />}
                  {TABLES[key].label}
                </button>
              );
            })}
          </div>
        </nav>

        <main className="main-content">
          {activeView === 'dashboard'
            ? <Dashboard onNavigate={setActiveView} />
            : activeView === 'analytics'
            ? <Analytics />
            : <TableView key={activeView} tableKey={activeView} table={TABLES[activeView]} />}
        </main>
      </div>
    </div>
  );
}
