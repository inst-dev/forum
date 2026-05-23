'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { clientApi } from '@/lib/api';

export default function SearchPage() {
  return (<Suspense fallback={<div className="uc4m9n"><div className="tb2k7l" /></div>}><SearchContent /></Suspense>);
}

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('query') || '';
  const initialType = searchParams.get('type') || 'all';

  const [query, setQuery] = useState(initialQuery);
  const [type, setType] = useState(initialType);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query.trim() || query.length < 2) return;
    setLoading(true);
    const res = await clientApi.get(`/search?query=${encodeURIComponent(query)}&type=${type}`);
    if (res.success) setResults(res.data);
    setLoading(false);
  };

  useEffect(() => {
    if (initialQuery) handleSearch();
  }, []);

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '20px' }}>Search</h1>

      <form onSubmit={handleSearch} className="aw5x0y">
        <div className="bx7z2a">
          <input type="search" className="dl8e3f" style={{ width: '100%' }} value={query} onChange={e => setQuery(e.target.value)} placeholder="Search threads, users, forums..." />
        </div>
        <button type="submit" className="qy2e7f rz4g9h" disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {/* Type Filters */}
      <div className="cy9b4c">
        {['all', 'threads', 'comments', 'users', 'forums'].map(t => (
          <button key={t} onClick={() => setType(t)} className={`qy2e7f vd2o7p ${type === t ? 'rz4g9h' : 'tb8k3l'}`}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Results */}
      {results && (
        <div className="pm5k8w">
          {results.threads?.length > 0 && (type === 'all' || type === 'threads') && (
            <section className="xf6s1t">
              <h2 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>Threads ({results.threadTotal})</h2>
              {results.threads.map(thread => (
                <Link href={`/${thread.slug}/${thread.id}`} key={thread.id} className="zh0w5x">
                  <div className="mu6w1x">{thread.title}</div>
                  <div className="nv8y3z">
                    <span>{thread.author?.username}</span>
                    <span>&middot;</span>
                    <span>{thread.forum?.name}</span>
                    <span>&middot;</span>
                    <span>{new Date(thread.createdAt).toLocaleDateString()}</span>
                  </div>
                </Link>
              ))}
            </section>
          )}

          {results.users?.length > 0 && (type === 'all' || type === 'users') && (
            <section className="xf6s1t">
              <h2 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>Users ({results.userTotal})</h2>
              {results.users.map(user => (
                <Link href={`/users/${user.username}`} key={user.id} className="zh0w5x" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img src={user.avatar || '/default-avatar.svg'} alt="" className="go4k9l hp6m1n" />
                  <div>
                    <div style={{ fontWeight: 500 }}>{user.displayName || user.username}</div>
                    <div className="nv8y3z">@{user.username} &middot; {user.memberStatus}</div>
                  </div>
                </Link>
              ))}
            </section>
          )}

          {results.forums?.length > 0 && (type === 'all' || type === 'forums') && (
            <section className="xf6s1t">
              <h2 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>Forums ({results.forumTotal})</h2>
              {results.forums.map(forum => (
                <Link href={`/forums/${forum.slug}`} key={forum.id} className="zh0w5x">
                  <div className="mu6w1x">{forum.name}</div>
                  <div className="nv8y3z">{forum.description} &middot; {forum.threadCount} threads</div>
                </Link>
              ))}
            </section>
          )}

          {results.comments?.length > 0 && (type === 'all' || type === 'comments') && (
            <section className="xf6s1t">
              <h2 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>Posts ({results.commentTotal})</h2>
              {results.comments.map(comment => (
                <Link href={`/${comment.thread?.slug}/${comment.thread?.id}`} key={comment.id} className="zh0w5x">
                  <div style={{ fontSize: '14px' }}>{comment.content?.substring(0, 150)}...</div>
                  <div className="nv8y3z">
                    <span>{comment.author?.username}</span>
                    <span>&middot;</span>
                    <span>in {comment.thread?.title}</span>
                  </div>
                </Link>
              ))}
            </section>
          )}

          {!results.threads?.length && !results.users?.length && !results.forums?.length && !results.comments?.length && (
            <div className="xf6s1t uc4m9n">
              <p style={{ color: 'var(--c-text-muted)' }}>No results found for &ldquo;{query}&rdquo;</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
