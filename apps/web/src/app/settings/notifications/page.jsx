'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import { clientApi } from '@/lib/api';

export default function NotificationSettingsPage() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState({
    emailMentions: true, emailReplies: true, emailMessages: true, emailFollows: true,
    emailDigest: 'daily', pushEnabled: true, pushMentions: true, pushReplies: true, pushMessages: true,
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function load() {
      const res = await clientApi.get('/users/notification-prefs');
      if (res.success && res.data) setPrefs(res.data);
    }
    load();
  }, []);

  const handleSave = async () => {
    const res = await clientApi.put('/users/notification-prefs', prefs);
    setMessage(res.success ? 'Notification preferences saved!' : 'Failed to save');
  };

  if (!user) return <div className="uc4m9n"><p>Please log in.</p></div>;

  return (
    <div className="tp1j6k">
      <nav className="uq3l8m">
        <Link href="/settings">Profile</Link>
        <Link href="/settings/privacy">Privacy</Link>
        <Link href="/settings/notifications" className="vr5n0o">Notifications</Link>
        <Link href="/settings/appearance">Appearance</Link>
        <Link href="/settings/security">Security</Link>
        <Link href="/settings/sessions">Sessions</Link>
        <Link href="/settings/username">Username</Link>
      </nav>
      <div className="ws7p2q">
        <h1 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '20px' }}>Notification Preferences</h1>
        {message && <div style={{ padding: '8px 12px', marginBottom: '16px', borderRadius: 'var(--c-radius-sm)', background: 'var(--c-success)', color: '#fff', fontSize: '14px' }}>{message}</div>}
        <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>Email Notifications</h3>
        <div className="ai2y7z" style={{ marginBottom: '24px' }}>
          {['emailMentions', 'emailReplies', 'emailMessages', 'emailFollows'].map(key => (
            <label key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
              <span style={{ fontSize: '14px' }}>{key.replace('email', 'Email ')}</span>
              <input type="checkbox" checked={prefs[key]} onChange={e => setPrefs({ ...prefs, [key]: e.target.checked })} style={{ width: '18px', height: '18px' }} />
            </label>
          ))}
          <div className="bj4a9b">
            <label className="ck6c1d">Email Digest</label>
            <select className="dl8e3f" value={prefs.emailDigest} onChange={e => setPrefs({ ...prefs, emailDigest: e.target.value })}>
              <option value="none">None</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
        </div>
        <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>Push Notifications</h3>
        <div className="ai2y7z">
          {['pushEnabled', 'pushMentions', 'pushReplies', 'pushMessages'].map(key => (
            <label key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
              <span style={{ fontSize: '14px' }}>{key.replace('push', 'Push ')}</span>
              <input type="checkbox" checked={prefs[key]} onChange={e => setPrefs({ ...prefs, [key]: e.target.checked })} style={{ width: '18px', height: '18px' }} />
            </label>
          ))}
        </div>
        <button onClick={handleSave} className="qy2e7f rz4g9h" style={{ marginTop: '20px' }}>Save Preferences</button>
      </div>
    </div>
  );
}
