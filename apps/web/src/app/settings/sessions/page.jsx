'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import { clientApi } from '@/lib/api';

export default function SessionsPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    async function load() {
      const res = await clientApi.get('/auth/sessions');
      if (res.success) setSessions(res.data);
    }
    load();
  }, []);

  const revokeSession = async (sessionId) => {
    await clientApi.delete(`/auth/sessions/${sessionId}`);
    setSessions(prev => prev.filter(s => s.id !== sessionId));
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
        <Link href="/settings/sessions" className="vr5n0o">Sessions</Link>
        <Link href="/settings/username">Username</Link>
      </nav>
      <div className="ws7p2q">
        <h1 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '20px' }}>Active Sessions</h1>
        <div className="ai2y7z">
          {sessions.map(session => (
            <div key={session.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', border: '1px solid var(--c-border)', borderRadius: 'var(--c-radius-md)' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 500 }}>{session.deviceInfo || 'Unknown Device'}</div>
                <div style={{ fontSize: '12px', color: 'var(--c-text-muted)' }}>IP: {session.ipAddress} &middot; Last used: {new Date(session.lastUsed).toLocaleDateString()}</div>
              </div>
              <button onClick={() => revokeSession(session.id)} className="qy2e7f uc0m5n vd2o7p">Revoke</button>
            </div>
          ))}
          {sessions.length === 0 && <p style={{ color: 'var(--c-text-muted)' }}>No active sessions.</p>}
        </div>
      </div>
    </div>
  );
}
