'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { clientApi } from '@/lib/api';

export default function AdminBadgesPage() {
  const { user } = useAuth();
  const [badges, setBadges] = useState([]);
  const [form, setForm] = useState({ name: '', description: '', icon: '⭐', color: '#1a73e8', category: 'general' });

  useEffect(() => { loadBadges(); }, []);

  const loadBadges = async () => {
    const res = await clientApi.get('/admin/badges');
    if (res.success) setBadges(res.data);
  };

  const createBadge = async (e) => {
    e.preventDefault();
    await clientApi.post('/admin/badges', form);
    setForm({ name: '', description: '', icon: '⭐', color: '#1a73e8', category: 'general' });
    loadBadges();
  };

  if (!user || user.role !== 'ADMIN') return <div className="uc4m9n"><p>Access denied.</p></div>;

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '20px' }}>Badge Management</h1>
      <form onSubmit={createBadge} className="xf6s1t ai2y7z" style={{ marginBottom: '16px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 600 }}>Create Badge</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px 100px', gap: '8px' }}>
          <input className="dl8e3f" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Badge name" required />
          <input className="dl8e3f" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description" />
          <input className="dl8e3f" value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} placeholder="Icon" />
          <input type="color" className="dl8e3f" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} />
        </div>
        <button type="submit" className="qy2e7f rz4g9h vd2o7p">Create Badge</button>
      </form>
      <div className="xf6s1t" style={{ padding: 0 }}>
        {badges.map(badge => (
          <div key={badge.id} className="zh0w5x" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="px2c7d" style={{ background: badge.color + '20', color: badge.color, fontSize: '14px' }}>{badge.icon} {badge.name}</span>
            <span style={{ fontSize: '13px', color: 'var(--c-text-muted)' }}>{badge.description}</span>
          </div>
        ))}
        {badges.length === 0 && <div className="uc4m9n"><p style={{ color: 'var(--c-text-muted)' }}>No badges created.</p></div>}
      </div>
    </div>
  );
}
