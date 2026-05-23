'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { clientApi } from '@/lib/api';

export default function AdminReportsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [status, setStatus] = useState('PENDING');

  useEffect(() => { loadReports(); }, [status]);

  const loadReports = async () => {
    const res = await clientApi.get(`/admin/reports?status=${status}`);
    if (res.success) setReports(res.data);
  };

  const resolveReport = async (reportId, newStatus) => {
    await clientApi.put(`/admin/reports/${reportId}`, { status: newStatus });
    loadReports();
  };

  if (!user || !['ADMIN', 'SUPER_MODERATOR', 'MODERATOR'].includes(user.role)) return <div className="uc4m9n"><p>Access denied.</p></div>;

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '20px' }}>Reports</h1>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {['PENDING', 'REVIEWING', 'RESOLVED', 'DISMISSED'].map(s => (
          <button key={s} onClick={() => setStatus(s)} className={`qy2e7f vd2o7p ${status === s ? 'rz4g9h' : 'tb8k3l'}`}>{s}</button>
        ))}
      </div>

      <div className="xf6s1t" style={{ padding: 0 }}>
        {reports.map(report => (
          <div key={report.id} className="zh0w5x">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span className="px2c7d tb0k5l">{report.reason}</span>
                  <span className="px2c7d qy4e9f">{report.targetType}</span>
                </div>
                <p style={{ fontSize: '14px', marginBottom: '4px' }}>{report.description || 'No description provided'}</p>
                <div style={{ fontSize: '12px', color: 'var(--c-text-muted)' }}>
                  Reported by: {report.reporter?.username} &middot; {new Date(report.createdAt).toLocaleDateString()}
                  {report.reportedUser && ` · Against: ${report.reportedUser.username}`}
                </div>
              </div>
              {report.status === 'PENDING' && (
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button onClick={() => resolveReport(report.id, 'RESOLVED')} className="qy2e7f rz4g9h vd2o7p">Resolve</button>
                  <button onClick={() => resolveReport(report.id, 'DISMISSED')} className="qy2e7f tb8k3l vd2o7p">Dismiss</button>
                </div>
              )}
            </div>
          </div>
        ))}
        {reports.length === 0 && <div className="uc4m9n"><p style={{ color: 'var(--c-text-muted)' }}>No reports in this status.</p></div>}
      </div>
    </div>
  );
}
