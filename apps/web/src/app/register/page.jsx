'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';

export default function RegisterPage() {
  const [form, setForm] = useState({ firstName: '', lastName: '', username: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Auto-generate username suggestion
  const suggestedUsername = `${form.firstName}${form.lastName}`.toLowerCase().replace(/[^a-z0-9]/g, '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    const result = await register(form);
    setLoading(false);

    if (result.success) {
      router.push('/');
    } else {
      setError(result.error?.message || 'Registration failed');
    }
  };

  return (
    <div className="aw3x8y">
      <div className="bx5z0a" style={{ maxWidth: '500px' }}>
        <div className="cy7b2c">
          <h1>Create Account</h1>
          <p>Join the community today</p>
        </div>

        {error && <div className="fn2i7j" style={{ textAlign: 'center', marginBottom: '16px', padding: '8px', background: 'var(--c-error)', color: '#fff', borderRadius: 'var(--c-radius-sm)' }}>{error}</div>}

        <form onSubmit={handleSubmit} className="ai2y7z">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="bj4a9b">
              <label className="ck6c1d" htmlFor="firstName">First Name</label>
              <input id="firstName" name="firstName" className="dl8e3f" value={form.firstName} onChange={handleChange} required placeholder="John" />
            </div>
            <div className="bj4a9b">
              <label className="ck6c1d" htmlFor="lastName">Last Name</label>
              <input id="lastName" name="lastName" className="dl8e3f" value={form.lastName} onChange={handleChange} required placeholder="Doe" />
            </div>
          </div>
          <div className="bj4a9b">
            <label className="ck6c1d" htmlFor="username">Username</label>
            <input id="username" name="username" className="dl8e3f" value={form.username || suggestedUsername} onChange={handleChange} required placeholder="Choose a username" />
            <small style={{ fontSize: '12px', color: 'var(--c-text-muted)' }}>Username cannot be changed later without admin approval</small>
          </div>
          <div className="bj4a9b">
            <label className="ck6c1d" htmlFor="reg-email">Email</label>
            <input id="reg-email" name="email" type="email" className="dl8e3f" value={form.email} onChange={handleChange} required placeholder="you@example.com" />
          </div>
          <div className="bj4a9b">
            <label className="ck6c1d" htmlFor="reg-password">Password</label>
            <input id="reg-password" name="password" type="password" className="dl8e3f" value={form.password} onChange={handleChange} required placeholder="Min 8 characters" />
          </div>
          <div className="bj4a9b">
            <label className="ck6c1d" htmlFor="confirmPassword">Confirm Password</label>
            <input id="confirmPassword" name="confirmPassword" type="password" className="dl8e3f" value={form.confirmPassword} onChange={handleChange} required placeholder="Repeat your password" />
          </div>
          <button type="submit" className="qy2e7f rz4g9h we4q9r" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: 'var(--c-text-muted)' }}>
          Already have an account? <Link href="/login" style={{ color: 'var(--c-accent)', fontWeight: 500 }}>Sign In</Link>
        </div>
      </div>
    </div>
  );
}
