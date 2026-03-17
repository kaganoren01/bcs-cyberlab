import { useState } from 'react';
import { ShieldAlert, Mail, Lock, Loader } from 'lucide-react';

const ALLOWED_DOMAINS = ['bruins.belmont.edu', 'belmont.edu'];

function validateEmail(email) {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain || !ALLOWED_DOMAINS.includes(domain)) {
    return 'Only @bruins.belmont.edu or @belmont.edu email addresses are allowed.';
  }
  return null;
}

export default function LoginPage({ onLogin }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    const emailErr = validateEmail(email);
    if (emailErr) { setError(emailErr); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (mode === 'signup' && password !== confirm) { setError('Passwords do not match.'); return; }

    setLoading(true);
    try {
      const endpoint = mode === 'signup'
        ? '/.netlify/functions/auth-signup'
        : '/.netlify/functions/auth-login';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong.');
        return;
      }

      if (mode === 'signup') {
        setSuccess('Account created! You can now sign in.');
        setMode('login');
        setPassword('');
        setConfirm('');
      } else {
        onLogin(data.token, data.email);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <ShieldAlert size={32} className="login-logo-icon" />
          <div>
            <div className="login-title">
              <span className="logo-bracket">[</span>
              BCS CyberLab
              <span className="logo-bracket">]</span>
            </div>
            <div className="login-subtitle">Cybersecurity Operations Training</div>
          </div>
        </div>

        <div className="login-tabs">
          <button
            className={`login-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
          >
            Sign In
          </button>
          <button
            className={`login-tab ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => { setMode('signup'); setError(''); setSuccess(''); }}
          >
            Create Account
          </button>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-field">
            <label>Email</label>
            <div className="login-input-wrap">
              <Mail size={14} className="login-input-icon" />
              <input
                type="email"
                placeholder="you@bruins.belmont.edu"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="login-field">
            <label>Password</label>
            <div className="login-input-wrap">
              <Lock size={14} className="login-input-icon" />
              <input
                type="password"
                placeholder="Min. 8 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </div>
          </div>

          {mode === 'signup' && (
            <div className="login-field">
              <label>Confirm Password</label>
              <div className="login-input-wrap">
                <Lock size={14} className="login-input-icon" />
                <input
                  type="password"
                  placeholder="Repeat password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>
            </div>
          )}

          {error   && <div className="login-error">{error}</div>}
          {success && <div className="login-success">{success}</div>}

          <button type="submit" className="login-submit" disabled={loading}>
            {loading
              ? <><Loader size={14} className="spin" /> {mode === 'login' ? 'Signing in...' : 'Creating account...'}</>
              : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p className="login-restriction">
          Access restricted to <strong>@bruins.belmont.edu</strong> and <strong>@belmont.edu</strong> accounts.
        </p>
      </div>
    </div>
  );
}
