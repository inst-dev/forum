'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { clientApi } from '@/lib/api';

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState({});
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function load() {
      const res = await clientApi.get('/admin/settings');
      if (res.success) setSettings(res.data);
    }
    if (user?.role === 'ADMIN') load();
  }, [user]);

  const handleSave = async () => {
    const res = await clientApi.put('/admin/settings', settings);
    setMessage(res.success ? 'Settings saved!' : 'Failed to save');
  };

  if (!user || user.role !== 'ADMIN') return <div className="uc4m9n"><p>Access denied.</p></div>;

  const fields = [
    { key: 'site_name', label: 'Site Name', type: 'text' },
    { key: 'site_description', label: 'Site Description', type: 'text' },
    { key: 'site_logo', label: 'Logo URL', type: 'text' },
    { key: 'site_favicon', label: 'Favicon URL', type: 'text' },
    { key: 'primary_color', label: 'Primary Color', type: 'text' },
    { key: 'registration_enabled', label: 'Registration Enabled', type: 'text' },
    { key: 'require_email_verification', label: 'Require Email Verification', type: 'text' },
    { key: 'max_upload_size', label: 'Max Upload Size (MB)', type: 'text' },
    { key: 'captcha_enabled', label: 'CAPTCHA Enabled', type: 'text' },
    { key: 'maintenance_mode', label: 'Maintenance Mode', type: 'text' },
  ];

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '20px' }}>Site Settings</h1>
      {message && <div style={{ padding: '8px 12px', marginBottom: '16px', borderRadius: 'var(--c-radius-sm)', background: 'var(--c-success)', color: '#fff', fontSize: '14px' }}>{message}</div>}
      <div className="xf6s1t ai2y7z">
        {fields.map(field => (
          <div key={field.key} className="bj4a9b">
            <label className="ck6c1d">{field.label}</label>
            <input className="dl8e3f" value={settings[field.key] || ''} onChange={e => setSettings({ ...settings, [field.key]: e.target.value })} />
          </div>
        ))}
        <button onClick={handleSave} className="qy2e7f rz4g9h">Save Settings</button>
      </div>
    </div>
  );
}
