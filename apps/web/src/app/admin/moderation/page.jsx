'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { clientApi } from '@/lib/api';

export default function ModerationLogsPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    async function load() {
      const res = await clientApi.get('/admin/moderation-logs');
      if (res.success) setLogs(res.data);
    }
    if (user?.role === 'ADMIN' || user?.role === 'MODERATOR' || user?.role === 'SUPER_MODERATOR') load();
  }, [user]);

  if (!user) return <div className="uc4m9n"><p>Access denied.</p></div>;

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '20px' }}>Moderation Logs</h1>
      <div className="xf6s1t" style={{ padding: 0, overflow: 'hidden' }}>
        {logs.map(log => (
          <div key={log.id} className="zh0w5x">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="px2c7d tb0k5l">{log.action}</span>
                  <span style={{ fontSize: '14px' }}><strong>{log.moderator?.username}</strong> → {log.user?.username}</span>
                </div>
                {log.reason && <p style={{ fontSize: '13px', color: 'var(--c-text-muted)', marginTop: '4px' }}>{log.reason}</p>}
              </div>
              <time style={{ fontSize: '12px', color: 'var(--c-text-muted)' }}>{new Date(log.createdAt).toLocaleString()}</time>
            </div>
          </div>
        ))}
        {logs.length === 0 && <div className="uc4m9n"><p style={{ color: 'var(--c-text-muted)' }}>No moderation logs.</p></div>}
      </div>
    </div>
  );
}
