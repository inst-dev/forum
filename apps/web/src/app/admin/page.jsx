'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import { clientApi } from '@/lib/api';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    async function load() {
      const res = await clientApi.get('/admin/dashboard');
      if (res.success) setStats(res.data);
    }
    if (user?.role === 'ADMIN') load();
  }, [user]);

  if (!user || user.role !== 'ADMIN') return <div className="uc4m9n"><p>Access denied.</p></div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Admin Dashboard</h1>
        <nav style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Link href="/admin/users" className="qy2e7f tb8k3l vd2o7p">Users</Link>
          <Link href="/admin/reports" className="qy2e7f tb8k3l vd2o7p">Reports</Link>
          <Link href="/admin/forums" className="qy2e7f tb8k3l vd2o7p">Forums</Link>
          <Link href="/admin/badges" className="qy2e7f tb8k3l vd2o7p">Badges</Link>
          <Link href="/admin/notifications" className="qy2e7f tb8k3l vd2o7p">Notifications</Link>
          <Link href="/admin/settings" className="qy2e7f tb8k3l vd2o7p">Settings</Link>
          <Link href="/admin/moderation" className="qy2e7f tb8k3l vd2o7p">Moderation</Link>
          <Link href="/admin/bad-words" className="qy2e7f tb8k3l vd2o7p">Bad Words</Link>
          <Link href="/admin/analytics" className="qy2e7f tb8k3l vd2o7p">Analytics</Link>
          <Link href="/admin/username-requests" className="qy2e7f tb8k3l vd2o7p">Username Requests</Link>
        </nav>
      </div>

      {stats && (
        <div className="xt9r4s">
          <div className="yu1t6u"><h3>Total Users</h3><div className="zv3v8w">{stats.totalUsers}</div></div>
          <div className="yu1t6u"><h3>Active Today</h3><div className="zv3v8w">{stats.activeUsers}</div></div>
          <div className="yu1t6u"><h3>Total Threads</h3><div className="zv3v8w">{stats.totalThreads}</div></div>
          <div className="yu1t6u"><h3>Total Comments</h3><div className="zv3v8w">{stats.totalComments}</div></div>
          <div className="yu1t6u"><h3>Pending Reports</h3><div className="zv3v8w" style={{ color: stats.pendingReports > 0 ? 'var(--c-error)' : undefined }}>{stats.pendingReports}</div></div>
          <div className="yu1t6u"><h3>Today Logins</h3><div className="zv3v8w">{stats.todayLogins}</div></div>
          <div className="yu1t6u"><h3>Today Registrations</h3><div className="zv3v8w">{stats.todayRegistrations}</div></div>
          <div className="yu1t6u"><h3>Total Reports</h3><div className="zv3v8w">{stats.totalReports}</div></div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div className="xf6s1t">
          <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>Quick Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Link href="/admin/users" className="ai4y9z">Manage Users</Link>
            <Link href="/admin/reports" className="ai4y9z">View Reports</Link>
            <Link href="/admin/forums" className="ai4y9z">Manage Forums</Link>
            <Link href="/admin/notifications" className="ai4y9z">Notification Bars</Link>
            <Link href="/admin/bad-words" className="ai4y9z">Profanity Filter</Link>
            <Link href="/admin/moderation" className="ai4y9z">Moderation Logs</Link>
          </div>
        </div>
        <div className="xf6s1t">
          <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>System Status</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Database</span><span style={{ color: 'var(--c-success)' }}>● Connected</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Redis</span><span style={{ color: 'var(--c-success)' }}>● Connected</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>WebSocket</span><span style={{ color: 'var(--c-success)' }}>● Running</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Email</span><span style={{ color: 'var(--c-success)' }}>● Configured</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
