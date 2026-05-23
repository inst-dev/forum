'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import { clientApi } from '@/lib/api';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';
import { toast } from 'sonner';

export default function PrivacySettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    hideProfile: false, hideOnlineStatus: false, hideLastSeen: false,
    hideReactions: false, hideFollowers: false, hideBirthdate: false,
    hideMessages: false, hideEmail: true,
  });

  useEffect(() => {
    async function load() {
      const res = await clientApi.get('/users/privacy');
      if (res.success && res.data) setSettings(res.data);
    }
    load();
  }, []);

  const handleSave = async () => {
    const res = await clientApi.put('/users/privacy', settings);
    if (res.success) toast.success('Privacy settings saved');
    else toast.error('Failed to save');
  };

  if (!user) return <div className="uc4m9n"><p>Please log in.</p></div>;

  const labels = {
    hideProfile: 'Hide Profile',
    hideOnlineStatus: 'Hide Online Status',
    hideLastSeen: 'Hide Last Seen',
    hideReactions: 'Hide Reactions',
    hideFollowers: 'Hide Followers',
    hideBirthdate: 'Hide Birthdate',
    hideMessages: 'Disable Messages',
    hideEmail: 'Hide Email',
  };

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
        <div className="ai2y7z">
          {Object.entries(settings).filter(([k]) => k !== 'id' && k !== 'userId').map(([key, value]) => (
            <ToggleSwitch
              key={key}
              label={labels[key] || key}
              checked={value}
              onChange={(v) => setSettings({ ...settings, [key]: v })}
            />
          ))}
          <button onClick={handleSave} className="qy2e7f rz4g9h" style={{ marginTop: '16px' }}>Save Privacy Settings</button>
        </div>
        <p style={{ marginTop: '16px', fontSize: '13px', color: 'var(--c-text-muted)' }}>When &ldquo;Hide Profile&rdquo; is enabled, your profile will return 404 to other users.</p>
      </div>
    </div>
  );
}
