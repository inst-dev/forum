'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { clientApi } from '@/lib/api';

export default function AdminAnalyticsPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [period, setPeriod] = useState('7d');

  useEffect(() => {
    async function load() {
      const res = await clientApi.get(`/admin/analytics?period=${period}`);
      if (res.success) setData(res.data);
    }
    if (user?.role === 'ADMIN') load();
  }, [user, period]);

  if (!user || user.role !== 'ADMIN') return <div className="uc4m9n"><p>Access denied.</p></div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Analytics</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['7d', '30d', '90d'].map(p => (
            <button key={p} onClick={() => setPeriod(p)} className={`qy2e7f vd2o7p ${period === p ? 'rz4g9h' : 'tb8k3l'}`}>{p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : '90 Days'}</button>
          ))}
        </div>
      </div>

      {data && (
        <>
          <div className="xt9r4s">
            <div className="yu1t6u"><h3>New Users</h3><div className="zv3v8w">{data.newUsers}</div></div>
            <div className="yu1t6u"><h3>New Threads</h3><div className="zv3v8w">{data.newThreads}</div></div>
            <div className="yu1t6u"><h3>New Comments</h3><div className="zv3v8w">{data.newComments}</div></div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="xf6s1t">
              <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>Top Threads (by views)</h3>
              {data.topThreads?.map((t, i) => (
                <div key={t.id} className="zh0w5x" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 700, color: 'var(--c-text-muted)', width: '24px' }}>{i + 1}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: 500 }}>{t.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--c-text-muted)' }}>{t.viewCount} views · {t.commentCount} replies</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="xf6s1t">
              <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>Top Users (by points)</h3>
              {data.topUsers?.map((u, i) => (
                <div key={u.id} className="zh0w5x" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 700, color: 'var(--c-text-muted)', width: '24px' }}>{i + 1}</span>
                  <img src={u.avatar || '/default-avatar.svg'} alt="" className="go4k9l hp6m1n" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: 500 }}>{u.username}</div>
                    <div style={{ fontSize: '12px', color: 'var(--c-text-muted)' }}>{u.points} points</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
