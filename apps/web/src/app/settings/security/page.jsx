'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import { clientApi } from '@/lib/api';

export default function SecuritySettingsPage() {
  const { user } = useAuth();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMessage(''); setError('');
    if (form.newPassword !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    const res = await clientApi.put('/users/password', form);
    if (res.success) {
      setMessage('Password changed successfully');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } else {
      setError(res.error?.message || 'Failed to change password');
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
        <Link href="/settings/security" className="vr5n0o">Security</Link>
        <Link href="/settings/sessions">Sessions</Link>
        <Link href="/settings/username">Username</Link>
      </nav>
      <div className="ws7p2q">
        <h1 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '20px' }}>Security</h1>
        
        <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>Change Password</h3>
        {message && <div style={{ padding: '8px 12px', marginBottom: '16px', borderRadius: 'var(--c-radius-sm)', background: 'var(--c-success)', color: '#fff', fontSize: '14px' }}>{message}</div>}
        {error && <div style={{ padding: '8px 12px', marginBottom: '16px', borderRadius: 'var(--c-radius-sm)', background: 'var(--c-error)', color: '#fff', fontSize: '14px' }}>{error}</div>}

        <form onSubmit={handleChangePassword} className="ai2y7z">
          <div className="bj4a9b">
            <label className="ck6c1d">Current Password</label>
            <input type="password" className="dl8e3f" value={form.currentPassword} onChange={e => setForm({ ...form, currentPassword: e.target.value })} required />
          </div>
          <div className="bj4a9b">
            <label className="ck6c1d">New Password</label>
            <input type="password" className="dl8e3f" value={form.newPassword} onChange={e => setForm({ ...form, newPassword: e.target.value })} required minLength={8} />
          </div>
          <div className="bj4a9b">
            <label className="ck6c1d">Confirm New Password</label>
            <input type="password" className="dl8e3f" value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} required />
          </div>
          <button type="submit" className="qy2e7f rz4g9h">Change Password</button>
        </form>

        <hr style={{ margin: '24px 0', border: 'none', borderTop: '1px solid var(--c-border)' }} />
        <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>Two-Factor Authentication</h3>
        <p style={{ fontSize: '14px', color: 'var(--c-text-muted)', marginBottom: '12px' }}>Add an extra layer of security with TOTP 2FA.</p>
        <button className="qy2e7f sa6i1j">Enable 2FA</button>

        <hr style={{ margin: '24px 0', border: 'none', borderTop: '1px solid var(--c-border)' }} />
        <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--c-error)' }}>Danger Zone</h3>
        <button className="qy2e7f uc0m5n" onClick={async () => { await clientApi.post('/auth/logout-all'); }}>Sign Out All Devices</button>
      </div>
    </div>
  );
}
