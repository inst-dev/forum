'use client';

import Link from 'next/link';
import { useTheme } from '@/components/providers/ThemeProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import { clientApi } from '@/lib/api';

export default function AppearanceSettingsPage() {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();

  const handleThemeChange = async (newTheme) => {
    setTheme(newTheme);
    if (user) {
      await clientApi.put('/users/theme', { theme: newTheme });
    }
  };

  return (
    <div className="tp1j6k">
      <nav className="uq3l8m">
        <Link href="/settings">Profile</Link>
        <Link href="/settings/privacy">Privacy</Link>
        <Link href="/settings/notifications">Notifications</Link>
        <Link href="/settings/appearance" className="vr5n0o">Appearance</Link>
        <Link href="/settings/security">Security</Link>
        <Link href="/settings/sessions">Sessions</Link>
        <Link href="/settings/username">Username</Link>
      </nav>
      <div className="ws7p2q">
        <h1 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '20px' }}>Appearance</h1>
        <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>Theme</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {['light', 'dark', 'system'].map(t => (
            <button key={t} onClick={() => handleThemeChange(t)} className="xf6s1t" style={{ padding: '20px', textAlign: 'center', cursor: 'pointer', border: theme === t ? '2px solid var(--c-accent)' : '1px solid var(--c-border)' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>{t === 'light' ? '☀️' : t === 'dark' ? '🌙' : '💻'}</div>
              <div style={{ fontSize: '14px', fontWeight: 500, textTransform: 'capitalize' }}>{t}</div>
            </button>
          ))}
        </div>
        <p style={{ marginTop: '16px', fontSize: '13px', color: 'var(--c-text-muted)' }}>Theme syncs across devices when logged in.</p>
      </div>
    </div>
  );
}
