'use client';

import { useState } from 'react';
import Link from 'next/link';
import { clientApi } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await clientApi.post('/auth/forgot-password', { email });
    setSent(true);
    setLoading(false);
  };

  if (sent) {
    return (
      <div className="aw3x8y">
        <div className="bx5z0a">
          <div className="cy7b2c">
            <h1>Check Your Email</h1>
            <p>If an account with that email exists, we&apos;ve sent a password reset link.</p>
          </div>
          <Link href="/login" className="qy2e7f rz4g9h we4q9r" style={{ textAlign: 'center' }}>Back to Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="aw3x8y">
      <div className="bx5z0a">
        <div className="cy7b2c">
          <h1>Forgot Password</h1>
          <p>Enter your email to receive a reset link</p>
        </div>
        <form onSubmit={handleSubmit} className="ai2y7z">
          <div className="bj4a9b">
            <label className="ck6c1d" htmlFor="email">Email Address</label>
            <input id="email" type="email" className="dl8e3f" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" />
          </div>
          <button type="submit" className="qy2e7f rz4g9h we4q9r" disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <Link href="/login" style={{ fontSize: '14px', color: 'var(--c-text-muted)' }}>Back to login</Link>
        </div>
      </div>
    </div>
  );
}
