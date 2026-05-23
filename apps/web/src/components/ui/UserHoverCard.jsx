'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { clientApi } from '@/lib/api';
import { TimeAgo } from './TimeAgo';
import { VerifiedBadge } from './VerifiedBadge';

export function UserHoverCard({ username, children }) {
  const [show, setShow] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef(null);
  const cardRef = useRef(null);

  const handleEnter = () => {
    timeoutRef.current = setTimeout(async () => {
      setShow(true);
      if (!data && !loading) {
        setLoading(true);
        const res = await clientApi.get(`/users/${username}`);
        if (res.success) setData(res.data);
        setLoading(false);
      }
    }, 400);
  };

  const handleLeave = () => {
    clearTimeout(timeoutRef.current);
    setTimeout(() => {
      if (!cardRef.current?.matches(':hover')) {
        setShow(false);
      }
    }, 200);
  };

  return (
    <span style={{ position: 'relative', display: 'inline-flex' }} onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      {children}
      {show && (
        <div
          ref={cardRef}
          onMouseLeave={() => setShow(false)}
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            zIndex: 100,
            marginTop: '8px',
            background: 'var(--c-bg-elevated)',
            border: '1px solid var(--c-border)',
            borderRadius: 'var(--c-radius-lg)',
            boxShadow: 'var(--c-shadow-lg)',
            padding: '16px',
            minWidth: '280px',
            animation: 'slideUp 0.15s ease',
          }}
        >
          {loading && <div style={{ fontSize: '13px', color: 'var(--c-text-muted)' }}>Loading...</div>}
          {data && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <img src={data.avatar || '/default-avatar.svg'} alt="" style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Link href={`/users/${data.username}`} style={{ fontWeight: 600, fontSize: '15px' }}>{data.displayName || data.username}</Link>
                    {data.isVerified && <VerifiedBadge size={14} />}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--c-text-muted)' }}>@{data.username} &middot; {data.memberStatus}</div>
                </div>
              </div>
              {data.bio && <p style={{ fontSize: '13px', color: 'var(--c-text-secondary)', marginBottom: '10px', lineHeight: 1.4 }}>{data.bio.substring(0, 100)}{data.bio.length > 100 ? '...' : ''}</p>}
              <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--c-text-muted)', marginBottom: '10px' }}>
                <span><strong style={{ color: 'var(--c-text-primary)' }}>{data.points}</strong> points</span>
                <span><strong style={{ color: 'var(--c-text-primary)' }}>{data.reactionScore}</strong> reactions</span>
                <span><strong style={{ color: 'var(--c-text-primary)' }}>{data.threadCount}</strong> threads</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--c-text-muted)', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span>Joined <TimeAgo date={data.joinedAt} /></span>
                {data.isOnline && <span style={{ color: 'var(--c-success)' }}>● Online</span>}
                {data.lastSeen && !data.isOnline && <span>Active <TimeAgo date={data.lastSeen} /></span>}
              </div>
            </>
          )}
        </div>
      )}
    </span>
  );
}
