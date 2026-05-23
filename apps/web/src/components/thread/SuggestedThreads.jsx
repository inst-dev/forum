'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import { clientApi } from '@/lib/api';
import { TimeAgo } from '@/components/ui/TimeAgo';
import { buildThreadUrl } from '@/lib/thread-url';

export function SuggestedThreads() {
  const { user, loading: authLoading } = useAuth();
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [algorithm, setAlgorithm] = useState('');

  useEffect(() => {
    if (authLoading) return;

    async function fetchSuggested() {
      try {
        if (user) {
          // Logged in: get personalized suggestions
          const res = await clientApi.get('/threads/suggested?limit=6');
          if (res.success && res.data?.length > 0) {
            setThreads(res.data);
            setAlgorithm(res.meta?.algorithm || 'engagement_weighted');
          } else {
            // Fallback to popular
            await fetchPopular();
          }
        } else {
          // Not logged in: show popular/trending threads
          await fetchPopular();
        }
      } catch {
        await fetchPopular();
      }
      setLoading(false);
    }

    async function fetchPopular() {
      try {
        const res = await clientApi.get('/threads?limit=6&sort=popular');
        if (res.success && res.data?.length > 0) {
          setThreads(res.data);
          setAlgorithm('trending');
        }
      } catch {
        // ignore
      }
    }

    fetchSuggested();
  }, [user, authLoading]);

  if (loading || threads.length === 0) return null;

  const sectionTitle = user && algorithm === 'engagement_weighted'
    ? 'Recommended For You'
    : 'Trending Threads';

  const badgeText = user && algorithm === 'engagement_weighted'
    ? 'Personalized'
    : 'Popular now';

  return (
    <section className="xf6s1t" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--c-border-light)' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--c-accent)' }}>
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          {sectionTitle}
        </h2>
        <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '12px', background: 'var(--c-accent-light)', color: 'var(--c-accent)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
          {badgeText}
        </span>
      </div>
      <div>
        {threads.map(thread => (
          <Link href={buildThreadUrl(thread.slug, thread.id)} key={thread.id} className="ks2s7t">
            <img src={thread.author?.avatar || '/default-avatar.svg'} alt="" className="go4k9l hp6m1n" style={{ borderRadius: '50%' }} />
            <div className="lt4u9v">
              <h3 className="mu6w1x">{thread.title}</h3>
              <div className="nv8y3z">
                <span>{thread.author?.username}</span>
                <span>&middot;</span>
                <span>{thread.forum?.name}</span>
                <span>&middot;</span>
                <TimeAgo date={thread.createdAt} />
              </div>
            </div>
            <div className="ow0a5b">
              <span>{thread.commentCount} replies</span>
              <span>{thread.viewCount} views</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
