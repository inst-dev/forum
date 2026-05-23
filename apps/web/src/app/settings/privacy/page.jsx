'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import { clientApi } from '@/lib/api';

export default function PrivacySettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    hideProfile: false, hideOnlineStatus: false, hideLastSeen: false,
    hideReactions: false, hideFollowers: false, hideBirthdate: false,
    hideMessages: false, hideEmail: true,
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function load() {
      const res = await clientApi.get('/users/privacy');
      if (res.success && res.data) setSettings(res.data);
    }
    load();
  }, []);

  const handleSave = async () => {
    const res = await clientApi.put('/users/privacy', settings);
    setMessage(res.success ? 'Privacy settings saved!' : 'Failed to save');
  };

  if (!user) return <div className="uc4m9n"><p>Please log in.</p></div>;

  return (
    <div className="tp1j6k">
      <nav className="uq3l8m">
        <Link href="/settings">Profile</Link>
        <Link href="/settings/privacy" className="vr5n0o">Privacy</Link>
        <Link href="/settings/notifications">Notifications</Link>
        <Link href="/settings/appearance">Appearance</Link>
        <Link href="/settings/security">Security</Link>
        <Link href="/settings/sessions">Sessions</Link>
        <Link href="/settings/username">Username</Link>
      </nav>
      <div className="ws7p2q">
        <h1 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '20px' }}>Privacy Settings</h1>
        {message && <div style={{ padding: '8px 12px', marginBottom: '16px', borderRadius: 'var(--c-radius-sm)', background: 'var(--c-success)', color: '#fff', fontSize: '14px' }}>{message}</div>}
        <div className="ai2y7z">
          {Object.entries(settings).filter(([k]) => k !== 'id' && k !== 'userId').map(([key, value]) => (
            <label key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--c-border-light)' }}>
              <span style={{ fontSize: '14px' }}>{key.replace(/([A-Z])/g, ' $1').replace('hide', 'Hide')}</span>
              <input type="checkbox" checked={value} onChange={e => setSettings({ ...settings, [key]: e.target.checked })} style={{ width: '18px', height: '18px' }} />
            </label>
          ))}
          <button onClick={handleSave} className="qy2e7f rz4g9h" style={{ marginTop: '16px' }}>Save Privacy Settings</button>
        </div>
        <p style={{ marginTop: '16px', fontSize: '13px', color: 'var(--c-text-muted)' }}>When &ldquo;Hide Profile&rdquo; is enabled, your profile will return 404 to other users and you won&apos;t appear in search results.</p>
      </div>
    </div>
  );
}
