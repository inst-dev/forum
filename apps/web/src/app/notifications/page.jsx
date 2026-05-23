'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import { clientApi } from '@/lib/api';

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await clientApi.get('/notifications?limit=50');
      if (res.success) setNotifications(res.data);
      setLoading(false);
    }
    if (user) load();
  }, [user]);

  const markAllRead = async () => {
    await clientApi.put('/notifications/read-all');
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const markRead = async (id) => {
    await clientApi.put(`/notifications/${id}/read`);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  if (!user) return <div className="uc4m9n"><p>Please log in.</p></div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Notifications</h1>
        <button onClick={markAllRead} className="qy2e7f tb8k3l vd2o7p">Mark all as read</button>
      </div>

      <div className="xf6s1t" style={{ padding: 0, overflow: 'hidden' }}>
        {notifications.map(n => (
          <div key={n.id} className="zh0w5x" style={{ background: n.isRead ? undefined : 'var(--c-accent-light)', display: 'flex', alignItems: 'center', gap: '12px' }} onClick={() => markRead(n.id)}>
            {n.actor && <img src={n.actor.avatar || '/default-avatar.svg'} alt="" className="go4k9l hp6m1n" />}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: n.isRead ? 400 : 500 }}>{n.message}</div>
              <div style={{ fontSize: '12px', color: 'var(--c-text-muted)' }}>{new Date(n.createdAt).toLocaleString()}</div>
            </div>
            {n.link && <Link href={n.link} className="qy2e7f tb8k3l vd2o7p">View</Link>}
          </div>
        ))}
        {!loading && notifications.length === 0 && (
          <div className="uc4m9n">
            <p style={{ color: 'var(--c-text-muted)' }}>No notifications yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
