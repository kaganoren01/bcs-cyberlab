import { useState, useEffect } from 'react';
import { Settings, Plus, X, Save, Globe, Lock, Loader, CheckCircle, AlertCircle } from 'lucide-react';

export default function AdminPanel({ token, onClose }) {
  const [domains, setDomains] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null); // { type: 'success'|'error', msg }

  useEffect(() => {
    fetch('/.netlify/functions/settings-get')
      .then(r => r.json())
      .then(data => {
        setIsOpen(data.isOpen);
        setDomains(data.isOpen ? [] : (data.allowedDomains ?? []));
      })
      .catch(() => setStatus({ type: 'error', msg: 'Failed to load settings.' }))
      .finally(() => setLoading(false));
  }, []);

  function addDomain() {
    const d = newDomain.toLowerCase().trim().replace(/^@/, '');
    if (!d || domains.includes(d)) { setNewDomain(''); return; }
    setDomains(prev => [...prev, d]);
    setNewDomain('');
  }

  function removeDomain(d) {
    setDomains(prev => prev.filter(x => x !== d));
  }

  async function save() {
    setSaving(true);
    setStatus(null);
    const payload = isOpen ? ['*'] : domains;
    try {
      const res = await fetch('/.netlify/functions/admin-update-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ allowedDomains: payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed.');
      setStatus({ type: 'success', msg: 'Settings saved successfully.' });
    } catch (e) {
      setStatus({ type: 'error', msg: e.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="admin-panel">
        <div className="admin-header">
          <div className="admin-title">
            <Settings size={16} />
            Admin Settings
          </div>
          <button className="close-btn" onClick={onClose}><X size={16} /></button>
        </div>

        {loading ? (
          <div className="admin-loading"><Loader size={16} className="spin" /> Loading settings…</div>
        ) : (
          <div className="admin-body">
            <div className="admin-section-label">Registration Access</div>

            <div className="admin-toggle-row">
              <button
                className={`admin-toggle ${!isOpen ? 'active' : ''}`}
                onClick={() => setIsOpen(false)}
              >
                <Lock size={14} /> Restricted
              </button>
              <button
                className={`admin-toggle ${isOpen ? 'active' : ''}`}
                onClick={() => setIsOpen(true)}
              >
                <Globe size={14} /> Open (anyone)
              </button>
            </div>

            {isOpen ? (
              <p className="admin-hint">Anyone with any email address can create an account.</p>
            ) : (
              <>
                <p className="admin-hint">Only emails from these domains can register:</p>
                <div className="domain-list">
                  {domains.map(d => (
                    <div key={d} className="domain-tag">
                      @{d}
                      <button className="domain-remove" onClick={() => removeDomain(d)} title="Remove">
                        <X size={11} />
                      </button>
                    </div>
                  ))}
                  {domains.length === 0 && (
                    <span className="admin-hint" style={{ fontStyle: 'italic' }}>No domains — no one can register.</span>
                  )}
                </div>
                <div className="domain-add-row">
                  <input
                    className="domain-input"
                    placeholder="e.g. example.edu"
                    value={newDomain}
                    onChange={e => setNewDomain(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addDomain()}
                  />
                  <button className="domain-add-btn" onClick={addDomain}>
                    <Plus size={14} /> Add
                  </button>
                </div>
              </>
            )}

            {status && (
              <div className={`admin-status ${status.type}`}>
                {status.type === 'success'
                  ? <CheckCircle size={13} />
                  : <AlertCircle size={13} />}
                {status.msg}
              </div>
            )}

            <button className="admin-save-btn" onClick={save} disabled={saving}>
              {saving
                ? <><Loader size={14} className="spin" /> Saving…</>
                : <><Save size={14} /> Save Settings</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
