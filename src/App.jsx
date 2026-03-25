import { useState, useEffect } from 'react';
import {
  LayoutDashboard, ShieldAlert, Bell, Bug,
  Ticket, Server, Link2, Users, Building2,
  FileText, Radio, GitMerge, UserCheck, ContactRound,
  BarChart2, LogOut, Settings, Info, Menu, X,
} from 'lucide-react';
import { TABLES, PRIMARY_TABLES, REFERENCE_TABLES } from './utils/schema';
import Dashboard from './components/Dashboard';
import Analytics from './components/Analytics';
import TableView from './components/TableView';
import LoginPage from './components/LoginPage';
import AdminPanel from './components/AdminPanel';
import AboutPage from './components/AboutPage';
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

const MOBILE_NAV_BREAKPOINT = 768;

export default function App() {
  const { isAuthenticated, email, isAdmin, token, login, logout } = useAuth();
  const [activeView, setActiveView] = useState('dashboard');
  const [showAdmin, setShowAdmin] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setMobileNavOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileNavOpen]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > MOBILE_NAV_BREAKPOINT) setMobileNavOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  if (!isAuthenticated) return <LoginPage onLogin={login} />;

  function goTo(view) {
    setActiveView(view);
    setMobileNavOpen(false);
  }

  return (
    <div className={`app${mobileNavOpen ? ' app--nav-open' : ''}`}>
      {showAdmin && <AdminPanel token={token} onClose={() => setShowAdmin(false)} />}
      <header className="app-header">
        <div className="header-inner">
          <button
            type="button"
            className="mobile-nav-toggle"
            aria-expanded={mobileNavOpen}
            aria-controls="app-sidebar"
            aria-label={mobileNavOpen ? 'Close navigation menu' : 'Open navigation menu'}
            onClick={() => setMobileNavOpen((o) => !o)}
          >
            {mobileNavOpen ? <X size={20} strokeWidth={2} /> : <Menu size={20} strokeWidth={2} />}
          </button>
          <button type="button" className="logo" onClick={() => goTo('dashboard')}>
            <span className="logo-bracket">[</span>
            CDA
            <span className="logo-bracket">]</span>
          </button>
          <div className="header-divider" />
          <p className="header-sub">Cyber Dataset Analytics — MSSP Operations Training</p>
        </div>
        <div className="header-user">
          <span className="header-email">{email}</span>
          {isAdmin && (
            <button type="button" className="admin-btn" onClick={() => setShowAdmin(true)} title="Admin Settings">
              <Settings size={14} />
            </button>
          )}
          <button type="button" className="logout-btn" onClick={logout} title="Sign out">
            <LogOut size={14} /> <span className="logout-btn-text">Sign out</span>
          </button>
        </div>
      </header>

      <div className="app-body">
        <nav
          id="app-sidebar"
          className={`sidebar${mobileNavOpen ? ' sidebar--open' : ''}`}
        >
          <button
            type="button"
            className={`nav-item nav-dashboard ${activeView === 'dashboard' ? 'active' : ''}`}
            onClick={() => goTo('dashboard')}
          >
            <LayoutDashboard size={15} className="nav-icon" />
            Dashboard
          </button>
          <button
            type="button"
            className={`nav-item nav-dashboard ${activeView === 'analytics' ? 'active' : ''}`}
            onClick={() => goTo('analytics')}
          >
            <BarChart2 size={15} className="nav-icon" />
            Analytics
          </button>
          <button
            type="button"
            className={`nav-item nav-dashboard ${activeView === 'about' ? 'active' : ''}`}
            onClick={() => goTo('about')}
          >
            <Info size={15} className="nav-icon" />
            About
          </button>

          <div className="nav-divider" />

          <div className="nav-section">
            <span className="nav-label">Core Tables</span>
            {PRIMARY_TABLES.map(key => {
              const Icon = TABLE_ICONS[key];
              return (
                <button
                  type="button"
                  key={key}
                  className={`nav-item ${activeView === key ? 'active' : ''}`}
                  onClick={() => goTo(key)}
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
                  type="button"
                  key={key}
                  className={`nav-item ${activeView === key ? 'active' : ''}`}
                  onClick={() => goTo(key)}
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
            : activeView === 'about'
            ? <AboutPage />
            : <TableView key={activeView} tableKey={activeView} table={TABLES[activeView]} />}
        </main>

        {mobileNavOpen && (
          <button
            type="button"
            className="mobile-nav-backdrop"
            aria-label="Close navigation"
            onClick={() => setMobileNavOpen(false)}
          />
        )}
      </div>

      <footer className="app-footer">
        <span>Built by <strong>Oren Kagan</strong></span>
        <span className="footer-sep">·</span>
        <a href="https://github.com/kaganoren01/bcs-cyberlab" target="_blank" rel="noopener noreferrer">GitHub</a>
        <span className="footer-sep">·</span>
        <span>Built with React + Netlify</span>
      </footer>
    </div>
  );
}
