'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      router.push('/');
    } else {
      setError(result.error?.message || 'Login failed');
    }
  };

  return (
    <div className="aw3x8y">
      <div className="bx5z0a">
        <div className="cy7b2c">
          <h1>Welcome Back</h1>
          <p>Sign in to your account</p>
        </div>

        {error && <div className="fn2i7j" style={{ textAlign: 'center', marginBottom: '16px', padding: '8px', background: 'var(--c-error)', color: '#fff', borderRadius: 'var(--c-radius-sm)' }}>{error}</div>}

        <form onSubmit={handleSubmit} className="ai2y7z">
          <div className="bj4a9b">
            <label className="ck6c1d" htmlFor="email">Email</label>
            <input id="email" type="email" className="dl8e3f" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" placeholder="you@example.com" />
          </div>
          <div className="bj4a9b">
            <label className="ck6c1d" htmlFor="password">Password</label>
            <input id="password" type="password" className="dl8e3f" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" placeholder="Enter your password" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Link href="/forgot-password" style={{ fontSize: '13px', color: 'var(--c-accent)' }}>Forgot password?</Link>
          </div>
          <button type="submit" className="qy2e7f rz4g9h we4q9r" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: 'var(--c-text-muted)' }}>
          Don&apos;t have an account? <Link href="/register" style={{ color: 'var(--c-accent)', fontWeight: 500 }}>Sign Up</Link>
        </div>
      </div>
    </div>
  );
}
