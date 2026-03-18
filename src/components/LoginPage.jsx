import { useState, useEffect } from 'react';
import { ShieldAlert, Mail, Lock, Loader, ArrowLeft } from 'lucide-react';

const ALLOWED_DOMAINS = ['bruins.belmont.edu', 'belmont.edu'];

function validateEmail(email) {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain || !ALLOWED_DOMAINS.includes(domain)) {
    return 'Only @bruins.belmont.edu or @belmont.edu email addresses are allowed.';
  }
  return null;
}

// Detect reset token in URL on load
function getResetParams() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('reset_token');
  const email = params.get('email');
  return token && email ? { token, email: decodeURIComponent(email) } : null;
}

export default function LoginPage({ onLogin }) {
  // Capture reset params once at mount and store in state — URL gets cleared after
  const [resetParams] = useState(() => getResetParams());

  // mode: 'login' | 'signup' | 'forgot' | 'reset'
  const [mode, setMode] = useState(resetParams ? 'reset' : 'login');
  const [email, setEmail]       = useState(resetParams?.email ?? '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [loading, setLoading]   = useState(false);

  // Clear URL params so the token isn't visible or reusable from the address bar
  useEffect(() => {
    if (resetParams) {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  function switchMode(next) {
    setMode(next);
    setError('');
    setSuccess('');
    setPassword('');
    setConfirm('');
    if (next !== 'reset') setEmail('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (mode === 'forgot') {
      const emailErr = validateEmail(email);
      if (emailErr) { setError(emailErr); return; }

      setLoading(true);
      try {
        const res = await fetch('/.netlify/functions/auth-forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error || 'Something went wrong.'); return; }
        setSuccess(data.message);
      } catch {
        setError('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (mode === 'reset') {
      if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
      if (password !== confirm) { setError('Passwords do not match.'); return; }

      setLoading(true);
      try {
        const res = await fetch('/.netlify/functions/auth-reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, token: resetParams?.token, password }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error || 'Something went wrong.'); return; }
        setSuccess(data.message);
        setTimeout(() => switchMode('login'), 2000);
      } catch {
        setError('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
      return;
    }

    // login / signup
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
      if (!res.ok) { setError(data.error || 'Something went wrong.'); return; }

      if (mode === 'signup') {
        setSuccess('Account created! You can now sign in.');
        switchMode('login');
      } else {
        onLogin(data.token, data.email);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const TITLES = {
    login:  'Sign In',
    signup: 'Create Account',
    forgot: 'Reset Password',
    reset:  'Set New Password',
  };

  const SUBMITS = {
    login:  'Sign In',
    signup: 'Create Account',
    forgot: 'Send Reset Link',
    reset:  'Update Password',
  };

  const LOADING_LABELS = {
    login:  'Signing in...',
    signup: 'Creating account...',
    forgot: 'Sending link...',
    reset:  'Updating password...',
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <ShieldAlert size={32} className="login-logo-icon" />
          <div>
            <div className="login-title">
              <span className="logo-bracket">[</span>BCS CyberLab<span className="logo-bracket">]</span>
            </div>
            <div className="login-subtitle">Cybersecurity Operations Training</div>
          </div>
        </div>

        {/* Tabs — only for login/signup */}
        {(mode === 'login' || mode === 'signup') && (
          <div className="login-tabs">
            <button className={`login-tab ${mode === 'login'  ? 'active' : ''}`} onClick={() => switchMode('login')}>Sign In</button>
            <button className={`login-tab ${mode === 'signup' ? 'active' : ''}`} onClick={() => switchMode('signup')}>Create Account</button>
          </div>
        )}

        {/* Back button for forgot/reset */}
        {(mode === 'forgot' || mode === 'reset') && (
          <button className="login-back" onClick={() => switchMode('login')}>
            <ArrowLeft size={13} /> Back to Sign In
          </button>
        )}

        {mode === 'forgot' && (
          <p className="login-mode-desc">
            Enter your Belmont email and we'll send you a link to reset your password.
          </p>
        )}

        {mode === 'reset' && (
          <p className="login-mode-desc">
            Enter a new password for <strong>{email}</strong>.
          </p>
        )}

        <form className="login-form" onSubmit={handleSubmit}>

          {/* Email — shown on login, signup, forgot (not reset since it's pre-filled) */}
          {mode !== 'reset' && (
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
          )}

          {/* Password — not on forgot */}
          {mode !== 'forgot' && (
            <div className="login-field">
              <label>{mode === 'reset' ? 'New Password' : 'Password'}</label>
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
          )}

          {/* Confirm — signup and reset */}
          {(mode === 'signup' || mode === 'reset') && (
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

          {!success && (
            <button type="submit" className="login-submit" disabled={loading}>
              {loading
                ? <><Loader size={14} className="spin" /> {LOADING_LABELS[mode]}</>
                : SUBMITS[mode]}
            </button>
          )}

          {/* Forgot password link */}
          {mode === 'login' && (
            <button type="button" className="login-forgot-link" onClick={() => switchMode('forgot')}>
              Forgot your password?
            </button>
          )}
        </form>

        <p className="login-restriction">
          Access restricted to <strong>@bruins.belmont.edu</strong> and <strong>@belmont.edu</strong> accounts.
        </p>
      </div>
    </div>
  );
}
