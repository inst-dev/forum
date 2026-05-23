'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { clientApi } from '@/lib/api';
import { toast } from 'sonner';

export default function AdminUsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({});

  useEffect(() => {
    loadUsers();
  }, [page]);

  const loadUsers = async () => {
    const res = await clientApi.get(`/admin/users?page=${page}&search=${search}`);
    if (res.success) { setUsers(res.data); setMeta(res.meta || {}); }
  };

  const handleAction = async (userId, action, reason = '') => {
    const res = await clientApi.post('/admin/users/action', { userId, action, reason: reason || `Admin action: ${action}` });
    if (res.success) { toast.success(`${action} applied successfully`); loadUsers(); }
    else toast.error(res.error?.message || `Failed to ${action.toLowerCase()} user`);
  };

  if (!user || user.role !== 'ADMIN') return <div className="uc4m9n"><p>Access denied.</p></div>;

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '20px' }}>User Management</h1>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <input className="dl8e3f" style={{ flex: 1 }} value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by username or email..." />
        <button onClick={loadUsers} className="qy2e7f rz4g9h">Search</button>
      </div>

      <div className="xf6s1t" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ background: 'var(--c-bg-secondary)', borderBottom: '1px solid var(--c-border)' }}>
              <th style={{ padding: '10px 12px', textAlign: 'left' }}>User</th>
              <th style={{ padding: '10px 12px', textAlign: 'left' }}>Role</th>
              <th style={{ padding: '10px 12px', textAlign: 'left' }}>Status</th>
              <th style={{ padding: '10px 12px', textAlign: 'left' }}>Joined</th>
              <th style={{ padding: '10px 12px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid var(--c-border-light)' }}>
                <td style={{ padding: '10px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <img src={u.avatar || '/default-avatar.svg'} alt="" className="go4k9l hp6m1n" />
                    <div>
                      <div style={{ fontWeight: 500 }}>{u.username}</div>
                      <div style={{ fontSize: '12px', color: 'var(--c-text-muted)' }}>{u.email}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '10px 12px' }}><span className="px2c7d qy4e9f">{u.role}</span></td>
                <td style={{ padding: '10px 12px' }}>
                  {u.isBanned && <span className="px2c7d tb0k5l">Banned</span>}
                  {u.isMuted && <span className="px2c7d sa8i3j">Muted</span>}
                  {u.isShadowBanned && <span className="px2c7d" style={{ background: '#333', color: '#fff' }}>Shadow</span>}
                  {!u.isBanned && !u.isMuted && !u.isShadowBanned && <span className="px2c7d rz6g1h">Active</span>}
                </td>
                <td style={{ padding: '10px 12px', fontSize: '12px', color: 'var(--c-text-muted)' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                    {!u.isBanned ? (
                      <button onClick={() => handleAction(u.id, 'BAN')} className="qy2e7f uc0m5n vd2o7p">Ban</button>
                    ) : (
                      <button onClick={() => handleAction(u.id, 'UNBAN')} className="qy2e7f rz4g9h vd2o7p">Unban</button>
                    )}
                    <button onClick={() => handleAction(u.id, 'WARN')} className="qy2e7f sa6i1j vd2o7p">Warn</button>
                    {!u.isVerified && <button onClick={() => handleAction(u.id, 'VERIFY')} className="qy2e7f tb8k3l vd2o7p">Verify</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {meta.totalPages > 1 && (
        <div className="uc2m7n">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} className="vd4o9p" disabled={page === 1}>Previous</button>
          <span style={{ padding: '8px', fontSize: '14px' }}>Page {page} of {meta.totalPages}</span>
          <button onClick={() => setPage(p => p + 1)} className="vd4o9p" disabled={page >= meta.totalPages}>Next</button>
        </div>
      )}
    </div>
  );
}
