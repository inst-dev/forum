import Link from 'next/link';
import { api } from '@/lib/api';

export const metadata = { title: 'Latest Threads' };

export default async function ThreadsPage({ searchParams }) {
  const page = searchParams?.page || '1';
  const sort = searchParams?.sort || 'latest';

  const res = await api.get(`/threads?page=${page}&sort=${sort}&limit=25`);
  const threads = res?.data || [];
  const meta = res?.meta || {};

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Latest Threads</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link href="/threads?sort=latest" className={`qy2e7f vd2o7p ${sort === 'latest' ? 'rz4g9h' : 'tb8k3l'}`}>Latest</Link>
          <Link href="/threads?sort=popular" className={`qy2e7f vd2o7p ${sort === 'popular' ? 'rz4g9h' : 'tb8k3l'}`}>Popular</Link>
          <Link href="/threads?sort=active" className={`qy2e7f vd2o7p ${sort === 'active' ? 'rz4g9h' : 'tb8k3l'}`}>Active</Link>
        </div>
      </div>

      <div className="xf6s1t" style={{ padding: 0, overflow: 'hidden' }}>
        {threads.map(thread => (
          <Link href={`/${thread.slug}/${thread.id}`} key={thread.id} className="ks2s7t">
            <img src={thread.author?.avatar || '/default-avatar.svg'} alt="" className="go4k9l hp6m1n" />
            <div className="lt4u9v">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                {thread.isPinned && <span className="px2c7d sa8i3j">Pinned</span>}
                {thread.prefix && <span className="px2c7d" style={{ background: thread.prefix.color + '20', color: thread.prefix.color }}>{thread.prefix.name}</span>}
                <h3 className="mu6w1x">{thread.title}</h3>
              </div>
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
              <span>{thread.viewCount} views</span>
            </div>
          </Link>
        ))}
      </div>

      {meta.totalPages > 1 && (
        <div className="uc2m7n">
          {meta.hasPrev && <Link href={`/threads?page=${parseInt(page) - 1}&sort=${sort}`} className="vd4o9p">Previous</Link>}
          <span style={{ padding: '8px', fontSize: '14px', color: 'var(--c-text-muted)' }}>Page {meta.page} of {meta.totalPages}</span>
          {meta.hasNext && <Link href={`/threads?page=${parseInt(page) + 1}&sort=${sort}`} className="vd4o9p">Next</Link>}
        </div>
      )}
    </div>
  );
}
