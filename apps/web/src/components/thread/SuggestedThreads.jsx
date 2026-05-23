'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import { clientApi } from '@/lib/api';
import { TimeAgo } from '@/components/ui/TimeAgo';

export function SuggestedThreads() {
  const { user } = useAuth();
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    async function fetchSuggested() {
      const res = await clientApi.get('/threads/suggested?limit=5');
      if (res.success) setThreads(res.data);
      setLoading(false);
    }
    fetchSuggested();
  }, [user]);

  if (!user || loading) return null;
  if (threads.length === 0) return null;

  return (
    <section className="xf6s1t" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--c-border-light)' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600 }}>
          <span style={{ marginRight: '6px' }}>✨</span>Suggested For You
        </h2>
        <span style={{ fontSize: '12px', color: 'var(--c-text-muted)', background: 'var(--c-accent-light)', padding: '2px 8px', borderRadius: '10px', color: 'var(--c-accent)' }}>Based on your activity</span>
      </div>
      <div>
        {threads.map(thread => (
          <Link href={`/${thread.slug}/${thread.id.substring(0, 8)}`} key={thread.id} className="ks2s7t">
            <img src={thread.author?.avatar || '/default-avatar.svg'} alt="" className="go4k9l hp6m1n" style={{ borderRadius: '50%' }} />
            <div className="lt4u9v">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <h3 className="mu6w1x">{thread.title}</h3>
              </div>
              <div className="nv8y3z">
                <span>{thread.author?.username}</span>
                <span>&middot;</span>
                <span>{thread.forum?.name}</span>
                <span>&middot;</span>
                <TimeAgo date={thread.createdAt} />
                {thread.tags?.length > 0 && (
                  <>
                    <span>&middot;</span>
                    {thread.tags.slice(0, 2).map(t => (
                      <span key={t.tag.id} className="tg5g2a" style={{ background: 'var(--c-accent-light)', color: 'var(--c-accent)', borderColor: 'var(--c-accent)' }}>{t.tag.name}</span>
                    ))}
                  </>
                )}
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
