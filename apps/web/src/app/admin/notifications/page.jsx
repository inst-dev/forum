'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { clientApi } from '@/lib/api';

export default function AdminNotificationBarsPage() {
  const { user } = useAuth();
  const [bars, setBars] = useState([]);
  const [form, setForm] = useState({
    text: '', backgroundColor: '#1a73e8', textColor: '#ffffff',
    buttonText: '', buttonUrl: '', buttonColor: '#ffffff',
    isClosable: true, audience: 'all',
  });

  useEffect(() => { loadBars(); }, []);

  const loadBars = async () => {
    const res = await clientApi.get('/admin/notification-bars');
    if (res.success) setBars(res.data);
  };

  const addBar = async (e) => {
    e.preventDefault();
    await clientApi.post('/admin/notification-bars', form);
    setForm({ text: '', backgroundColor: '#1a73e8', textColor: '#ffffff', buttonText: '', buttonUrl: '', buttonColor: '#ffffff', isClosable: true, audience: 'all' });
    loadBars();
  };

  const deleteBar = async (id) => {
    await clientApi.delete(`/admin/notification-bars/${id}`);
    loadBars();
  };

  const toggleActive = async (bar) => {
    await clientApi.put(`/admin/notification-bars/${bar.id}`, { isActive: !bar.isActive });
    loadBars();
  };

  if (!user || user.role !== 'ADMIN') return <div className="uc4m9n"><p>Access denied.</p></div>;

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '20px' }}>Notification Bars</h1>

      <form onSubmit={addBar} className="xf6s1t ai2y7z" style={{ marginBottom: '16px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 600 }}>Create Notification Bar</h3>
        <div className="bj4a9b">
          <label className="ck6c1d">Text</label>
          <input className="dl8e3f" value={form.text} onChange={e => setForm({ ...form, text: e.target.value })} required placeholder="Notification message..." />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
          <div className="bj4a9b">
            <label className="ck6c1d">Background</label>
            <input type="color" className="dl8e3f" value={form.backgroundColor} onChange={e => setForm({ ...form, backgroundColor: e.target.value })} />
          </div>
          <div className="bj4a9b">
            <label className="ck6c1d">Text Color</label>
            <input type="color" className="dl8e3f" value={form.textColor} onChange={e => setForm({ ...form, textColor: e.target.value })} />
          </div>
          <div className="bj4a9b">
            <label className="ck6c1d">Audience</label>
            <select className="dl8e3f" value={form.audience} onChange={e => setForm({ ...form, audience: e.target.value })}>
              <option value="all">All</option>
              <option value="guests">Guests</option>
              <option value="members">Members</option>
              <option value="admins">Admins</option>
            </select>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div className="bj4a9b">
            <label className="ck6c1d">Button Text (optional)</label>
            <input className="dl8e3f" value={form.buttonText} onChange={e => setForm({ ...form, buttonText: e.target.value })} />
          </div>
          <div className="bj4a9b">
            <label className="ck6c1d">Button URL (optional)</label>
            <input className="dl8e3f" value={form.buttonUrl} onChange={e => setForm({ ...form, buttonUrl: e.target.value })} type="url" />
          </div>
        </div>
        {/* Preview */}
        {form.text && (
          <div className="vd6o1p" style={{ background: form.backgroundColor, color: form.textColor, borderRadius: 'var(--c-radius-md)' }}>
            <span>{form.text}</span>
            {form.buttonText && <span className="we8q3r" style={{ background: form.buttonColor + '33', color: form.textColor }}>{form.buttonText}</span>}
          </div>
        )}
        <button type="submit" className="qy2e7f rz4g9h">Create Bar</button>
      </form>

      <div className="xf6s1t" style={{ padding: 0 }}>
        {bars.map(bar => (
          <div key={bar.id} className="zh0w5x" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="vd6o1p" style={{ background: bar.backgroundColor, color: bar.textColor, borderRadius: '4px', display: 'inline-flex', padding: '4px 12px', fontSize: '13px' }}>
                {bar.text}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--c-text-muted)', marginTop: '4px' }}>
                Audience: {bar.audience} · {bar.isActive ? 'Active' : 'Inactive'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button onClick={() => toggleActive(bar)} className={`qy2e7f vd2o7p ${bar.isActive ? 'tb8k3l' : 'rz4g9h'}`}>{bar.isActive ? 'Disable' : 'Enable'}</button>
              <button onClick={() => deleteBar(bar.id)} className="qy2e7f uc0m5n vd2o7p">Delete</button>
            </div>
          </div>
        ))}
        {bars.length === 0 && <div className="uc4m9n"><p style={{ color: 'var(--c-text-muted)' }}>No notification bars.</p></div>}
      </div>
    </div>
  );
}
