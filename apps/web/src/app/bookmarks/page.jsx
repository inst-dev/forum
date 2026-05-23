'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import { clientApi } from '@/lib/api';

export default function BookmarksPage() {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState([]);

  useEffect(() => {
    async function load() {
      const res = await clientApi.get('/users/bookmarks');
      if (res.success) setBookmarks(res.data);
    }
    if (user) load();
  }, [user]);

  if (!user) return <div className="uc4m9n"><p>Please log in.</p></div>;

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '20px' }}>Bookmarks</h1>
      <div className="xf6s1t" style={{ padding: 0, overflow: 'hidden' }}>
        {bookmarks.map(thread => (
          <Link href={`/${thread.slug}/${thread.id}`} key={thread.id} className="ks2s7t">
            <img src={thread.author?.avatar || '/default-avatar.svg'} alt="" className="go4k9l hp6m1n" />
            <div className="lt4u9v">
              <h3 className="mu6w1x">{thread.title}</h3>
              <div className="nv8y3z">
                <span>{thread.author?.username}</span>
                <span>&middot;</span>
                <span>{thread.forum?.name}</span>
                <span>&middot;</span>
                <time>{new Date(thread.createdAt).toLocaleDateString()}</time>
              </div>
            </div>
            <div className="ow0a5b">
              <span>{thread.commentCount} replies</span>
            </div>
          </Link>
        ))}
        {bookmarks.length === 0 && <div className="uc4m9n"><p style={{ color: 'var(--c-text-muted)' }}>No bookmarks yet</p></div>}
      </div>
    </div>
  );
}
