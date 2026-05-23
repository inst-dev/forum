'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { clientApi } from '@/lib/api';
import { toast } from 'sonner';

export default function AdminUsernameRequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('PENDING');

  useEffect(() => { loadRequests(); }, [filter]);

  const loadRequests = async () => {
    const res = await clientApi.get(`/admin/username-requests?status=${filter}`);
    if (res.success) setRequests(res.data);
  };

  const handleAction = async (requestId, status) => {
    const adminNote = status === 'DENIED' ? prompt('Reason for denial (optional):') || '' : '';
    const res = await clientApi.put(`/admin/username-requests/${requestId}`, { status, adminNote });
    if (res.success) { toast.success(`Request ${status.toLowerCase()}`); loadRequests(); }
    else toast.error(res.error?.message || 'Failed to process request');
  };

  if (!user || user.role !== 'ADMIN') return <div className="uc4m9n"><p>Access denied.</p></div>;

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '20px' }}>Username Change Requests</h1>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {['PENDING', 'APPROVED', 'DENIED'].map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`qy2e7f vd2o7p ${filter === s ? 'rz4g9h' : 'tb8k3l'}`}>{s}</button>
        ))}
      </div>
      <div className="xf6s1t" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ background: 'var(--c-bg-secondary)', borderBottom: '1px solid var(--c-border)' }}>
              <th style={{ padding: '10px 12px', textAlign: 'left' }}>User</th>
              <th style={{ padding: '10px 12px', textAlign: 'left' }}>Current</th>
              <th style={{ padding: '10px 12px', textAlign: 'left' }}>Requested</th>
              <th style={{ padding: '10px 12px', textAlign: 'left' }}>Reason</th>
              <th style={{ padding: '10px 12px', textAlign: 'left' }}>Date</th>
              {filter === 'PENDING' && <th style={{ padding: '10px 12px', textAlign: 'right' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {requests.map(req => (
              <tr key={req.id} style={{ borderBottom: '1px solid var(--c-border-light)' }}>
                <td style={{ padding: '10px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <img src={req.user?.avatar || '/default-avatar.svg'} alt="" className="go4k9l hp6m1n" />
                    <span style={{ fontWeight: 500 }}>{req.user?.username}</span>
                  </div>
                </td>
                <td style={{ padding: '10px 12px', fontFamily: 'monospace' }}>{req.currentUsername}</td>
                <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontWeight: 600, color: 'var(--c-accent)' }}>{req.requestedUsername}</td>
                <td style={{ padding: '10px 12px', fontSize: '13px', color: 'var(--c-text-muted)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{req.reason}</td>
                <td style={{ padding: '10px 12px', fontSize: '12px', color: 'var(--c-text-muted)' }}>{new Date(req.createdAt).toLocaleDateString()}</td>
                {filter === 'PENDING' && (
                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                      <button onClick={() => handleAction(req.id, 'APPROVED')} className="qy2e7f rz4g9h vd2o7p">Approve</button>
                      <button onClick={() => handleAction(req.id, 'DENIED')} className="qy2e7f uc0m5n vd2o7p">Deny</button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {requests.length === 0 && (
              <tr><td colSpan={filter === 'PENDING' ? 6 : 5} style={{ padding: '24px', textAlign: 'center', color: 'var(--c-text-muted)' }}>No {filter.toLowerCase()} requests</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
