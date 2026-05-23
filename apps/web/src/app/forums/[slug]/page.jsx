import Link from 'next/link';
import { api } from '@/lib/api';
import { notFound } from 'next/navigation';
import { TimeAgo } from '@/components/ui/TimeAgo';

export async function generateMetadata({ params }) {
  const res = await api.get(`/forums/${params.slug}`);
  if (!res?.success) return { title: 'Forum Not Found' };
  return { title: res.data.name, description: res.data.description };
}

export default async function ForumPage({ params, searchParams }) {
  const page = searchParams?.page || '1';
  const sort = searchParams?.sort || 'latest';

  const [forumRes, threadsRes] = await Promise.all([
    api.get(`/forums/${params.slug}`),
    api.get(`/forums/${params.slug}/threads?page=${page}&sort=${sort}`),
  ]);

  if (!forumRes?.success) notFound();

  const forum = forumRes.data;
  const threads = threadsRes?.data || [];
  const meta = threadsRes?.meta || {};

  return (
    <div>
      {/* Breadcrumb */}
      <nav style={{ fontSize: '13px', color: 'var(--c-text-muted)', marginBottom: '16px', display: 'flex', gap: '4px' }}>
        <Link href="/">Home</Link><span>/</span>
        <Link href="/forums">Forums</Link><span>/</span>
        {forum.parent && (<><Link href={`/forums/${forum.parent.slug}`}>{forum.parent.name}</Link><span>/</span></>)}
        <span style={{ color: 'var(--c-text-primary)' }}>{forum.name}</span>
      </nav>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700 }}>{forum.name}</h1>
          {forum.description && <p style={{ color: 'var(--c-text-muted)', fontSize: '14px' }}>{forum.description}</p>}
        </div>
        <Link href={`/threads/new?forum=${forum.id}`} className="qy2e7f rz4g9h">New Thread</Link>
      </div>

      {/* Subforums */}
      {forum.children?.length > 0 && (
        <div className="xf6s1t" style={{ marginBottom: '16px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Subforums</h3>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {forum.children.map(child => (
              <Link key={child.id} href={`/forums/${child.slug}`} className="px2c7d qy4e9f">{child.name} ({child.threadCount})</Link>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <Link href={`/forums/${params.slug}?sort=latest`} className={`qy2e7f vd2o7p ${sort === 'latest' ? 'rz4g9h' : 'tb8k3l'}`}>Latest</Link>
        <Link href={`/forums/${params.slug}?sort=newest`} className={`qy2e7f vd2o7p ${sort === 'newest' ? 'rz4g9h' : 'tb8k3l'}`}>Newest</Link>
        <Link href={`/forums/${params.slug}?sort=views`} className={`qy2e7f vd2o7p ${sort === 'views' ? 'rz4g9h' : 'tb8k3l'}`}>Most Viewed</Link>
        <Link href={`/forums/${params.slug}?sort=replies`} className={`qy2e7f vd2o7p ${sort === 'replies' ? 'rz4g9h' : 'tb8k3l'}`}>Most Replies</Link>
      </div>

      {/* Thread List */}
      <div className="xf6s1t" style={{ padding: 0, overflow: 'hidden' }}>
        {threads.map(thread => (
          <Link href={`/${thread.slug}/${thread.id}`} key={thread.id} className="ks2s7t">
            <img src={thread.author?.avatar || '/default-avatar.svg'} alt="" className="go4k9l hp6m1n" style={{ borderRadius: '50%' }} />
            <div className="lt4u9v">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                {thread.isPinned && <span className="px2c7d sa8i3j">Pinned</span>}
                {thread.isLocked && <span className="px2c7d tb0k5l">Locked</span>}
                {thread.prefix && <span className="px2c7d" style={{ background: thread.prefix.color + '20', color: thread.prefix.color }}>{thread.prefix.name}</span>}
                <h3 className="mu6w1x">{thread.title}</h3>
              </div>
              <div className="nv8y3z">
                <span>{thread.author?.username}</span>
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
        {threads.length === 0 && (
          <div className="uc4m9n">
            <p style={{ color: 'var(--c-text-muted)' }}>No threads in this forum yet. <Link href={`/threads/new?forum=${forum.id}`}>Create the first one</Link></p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="uc2m7n">
          {meta.hasPrev && <Link href={`/forums/${params.slug}?page=${parseInt(page) - 1}&sort=${sort}`} className="vd4o9p">Previous</Link>}
          <span style={{ padding: '8px', fontSize: '14px', color: 'var(--c-text-muted)' }}>Page {meta.page} of {meta.totalPages}</span>
          {meta.hasNext && <Link href={`/forums/${params.slug}?page=${parseInt(page) + 1}&sort=${sort}`} className="vd4o9p">Next</Link>}
        </div>
      )}
    </div>
  );
}
