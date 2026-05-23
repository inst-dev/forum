'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { clientApi } from '@/lib/api';

export default function VerifyEmailPage() {
  return (<Suspense fallback={<div className="uc4m9n"><div className="tb2k7l" /></div>}><VerifyEmailContent /></Suspense>);
}

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('verifying');

  useEffect(() => {
    async function verify() {
      if (!token) { setStatus('error'); return; }
      const res = await clientApi.post('/auth/verify-email', { token });
      setStatus(res.success ? 'success' : 'error');
    }
    verify();
  }, [token]);

  return (
    <div className="aw3x8y">
      <div className="bx5z0a" style={{ textAlign: 'center' }}>
        {status === 'verifying' && <><div className="tb2k7l" style={{ margin: '0 auto 16px' }} /><p>Verifying your email...</p></>}
        {status === 'success' && (
          <>
            <h1 style={{ fontSize: '24px', marginBottom: '8px' }}>Email Verified!</h1>
            <p style={{ color: 'var(--c-text-muted)', marginBottom: '16px' }}>Your email has been verified successfully.</p>
            <Link href="/" className="qy2e7f rz4g9h">Go to Homepage</Link>
          </>
        )}
        {status === 'error' && (
          <>
            <h1 style={{ fontSize: '24px', marginBottom: '8px', color: 'var(--c-error)' }}>Verification Failed</h1>
            <p style={{ color: 'var(--c-text-muted)', marginBottom: '16px' }}>The verification link is invalid or has expired.</p>
            <Link href="/" className="qy2e7f tb8k3l">Go Home</Link>
          </>
        )}
      </div>
    </div>
  );
}
