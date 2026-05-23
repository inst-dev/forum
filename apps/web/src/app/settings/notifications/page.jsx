'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import { clientApi } from '@/lib/api';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';
import { toast } from 'sonner';

export default function NotificationSettingsPage() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState({
    emailMentions: true, emailReplies: true, emailMessages: true, emailFollows: true,
    emailDigest: 'daily', pushEnabled: true, pushMentions: true, pushReplies: true, pushMessages: true,
  });

  useEffect(() => {
    async function load() {
      const res = await clientApi.get('/users/notification-prefs');
      if (res.success && res.data) setPrefs(res.data);
    }
    load();
  }, []);

  const handleSave = async () => {
    const res = await clientApi.put('/users/notification-prefs', prefs);
    if (res.success) toast.success('Notification preferences saved');
    else toast.error('Failed to save');
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
        <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>Email Notifications</h3>
        <div className="ai2y7z" style={{ marginBottom: '24px' }}>
          <ToggleSwitch label="Mentions" checked={prefs.emailMentions} onChange={v => setPrefs({ ...prefs, emailMentions: v })} />
          <ToggleSwitch label="Replies" checked={prefs.emailReplies} onChange={v => setPrefs({ ...prefs, emailReplies: v })} />
          <ToggleSwitch label="Messages" checked={prefs.emailMessages} onChange={v => setPrefs({ ...prefs, emailMessages: v })} />
          <ToggleSwitch label="New Followers" checked={prefs.emailFollows} onChange={v => setPrefs({ ...prefs, emailFollows: v })} />
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
          <ToggleSwitch label="Enable Push" checked={prefs.pushEnabled} onChange={v => setPrefs({ ...prefs, pushEnabled: v })} />
          <ToggleSwitch label="Mentions" checked={prefs.pushMentions} onChange={v => setPrefs({ ...prefs, pushMentions: v })} />
          <ToggleSwitch label="Replies" checked={prefs.pushReplies} onChange={v => setPrefs({ ...prefs, pushReplies: v })} />
          <ToggleSwitch label="Messages" checked={prefs.pushMessages} onChange={v => setPrefs({ ...prefs, pushMessages: v })} />
        </div>
        <button onClick={handleSave} className="qy2e7f rz4g9h" style={{ marginTop: '20px' }}>Save Preferences</button>
      </div>
    </div>
  );
}
