'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { clientApi } from '@/lib/api';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    const res = await clientApi.post('/auth/reset-password', { token, password, confirmPassword });
    if (res.success) setSuccess(true);
    else setError(res.error?.message || 'Failed to reset password');
  };

  if (!token) {
    return <div className="aw3x8y"><div className="bx5z0a"><p>Invalid or missing reset token.</p></div></div>;
  }

  if (success) {
    return (
      <div className="aw3x8y">
        <div className="bx5z0a">
          <div className="cy7b2c"><h1>Password Reset</h1><p>Your password has been reset successfully.</p></div>
          <Link href="/login" className="qy2e7f rz4g9h we4q9r" style={{ textAlign: 'center' }}>Go to Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="aw3x8y">
      <div className="bx5z0a">
        <div className="cy7b2c"><h1>Reset Password</h1><p>Enter your new password</p></div>
        {error && <div style={{ padding: '8px 12px', marginBottom: '16px', borderRadius: 'var(--c-radius-sm)', background: 'var(--c-error)', color: '#fff', fontSize: '14px' }}>{error}</div>}
        <form onSubmit={handleSubmit} className="ai2y7z">
          <div className="bj4a9b">
            <label className="ck6c1d">New Password</label>
            <input type="password" className="dl8e3f" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} />
          </div>
          <div className="bj4a9b">
            <label className="ck6c1d">Confirm Password</label>
            <input type="password" className="dl8e3f" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
          </div>
          <button type="submit" className="qy2e7f rz4g9h we4q9r">Reset Password</button>
        </form>
      </div>
    </div>
  );
}
