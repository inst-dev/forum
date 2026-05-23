'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import { clientApi } from '@/lib/api';
import { TimeAgo } from '@/components/ui/TimeAgo';
import { buildThreadUrl } from '@/lib/thread-url';

export function SuggestedThreads() {
  const { user } = useAuth();
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    async function fetchSuggested() {
      const res = await clientApi.get('/threads/suggested?limit=5');
      if (res.success) setThreads(res.data);
      setLoading(false);
    }
    fetchSuggested();
  }, [user]);

  if (!user || loading || threads.length === 0) return null;

  return (
    <section className="xf6s1t" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--c-border-light)' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600 }}>Suggested For You</h2>
        <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '10px', background: 'var(--c-accent-light)', color: 'var(--c-accent)' }}>Based on your activity</span>
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
              <span>{thread.reactionCount} likes</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
