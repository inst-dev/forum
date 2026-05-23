'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import { clientApi } from '@/lib/api';

export default function UsernameChangePage() {
  const { user } = useAuth();
  const [form, setForm] = useState({ requestedUsername: '', reason: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(''); setError('');
    const res = await clientApi.post('/users/username-change-request', form);
    if (res.success) {
      setMessage('Your username change request has been submitted for admin review.');
      setForm({ requestedUsername: '', reason: '' });
    } else {
      setError(res.error?.message || 'Failed to submit request');
    }
  };

  if (!user) return <div className="uc4m9n"><p>Please log in.</p></div>;

  return (
    <div className="tp1j6k">
      <nav className="uq3l8m">
        <Link href="/settings">Profile</Link>
        <Link href="/settings/privacy">Privacy</Link>
        <Link href="/settings/notifications">Notifications</Link>
        <Link href="/settings/appearance">Appearance</Link>
        <Link href="/settings/security">Security</Link>
        <Link href="/settings/sessions">Sessions</Link>
        <Link href="/settings/username" className="vr5n0o">Username</Link>
      </nav>
      <div className="ws7p2q">
        <h1 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>Username Change Request</h1>
        <p style={{ fontSize: '14px', color: 'var(--c-text-muted)', marginBottom: '20px' }}>
          Usernames cannot be changed by users after registration. You may submit a request to an administrator for review. Username changes are rarely approved without a valid reason.
        </p>

        <div style={{ padding: '12px', background: 'var(--c-bg-secondary)', borderRadius: 'var(--c-radius-md)', marginBottom: '20px', fontSize: '14px' }}>
          <strong>Current username:</strong> @{user.username}
        </div>

        {message && <div style={{ padding: '8px 12px', marginBottom: '16px', borderRadius: 'var(--c-radius-sm)', background: 'var(--c-success)', color: '#fff', fontSize: '14px' }}>{message}</div>}
        {error && <div style={{ padding: '8px 12px', marginBottom: '16px', borderRadius: 'var(--c-radius-sm)', background: 'var(--c-error)', color: '#fff', fontSize: '14px' }}>{error}</div>}

        <form onSubmit={handleSubmit} className="ai2y7z">
          <div className="bj4a9b">
            <label className="ck6c1d">Requested Username</label>
            <input className="dl8e3f" value={form.requestedUsername} onChange={e => setForm({ ...form, requestedUsername: e.target.value })} required pattern="^[a-zA-Z0-9_]+$" minLength={3} maxLength={30} placeholder="new_username" />
            <small style={{ fontSize: '12px', color: 'var(--c-text-muted)' }}>Only letters, numbers, and underscores. 3-30 characters.</small>
          </div>
          <div className="bj4a9b">
            <label className="ck6c1d">Reason for change</label>
            <textarea className="dl8e3f em0g5h" value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} required minLength={10} maxLength={500} placeholder="Explain why you need a username change..." />
          </div>
          <button type="submit" className="qy2e7f rz4g9h">Submit Request</button>
        </form>
      </div>
    </div>
  );
}
