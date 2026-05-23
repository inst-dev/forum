import Link from 'next/link';
import { api } from '@/lib/api';
import { notFound } from 'next/navigation';
import { ThreadContent } from '@/components/thread/ThreadContent';
import { CommentList } from '@/components/thread/CommentList';

export async function generateMetadata({ params }) {
  const res = await api.get(`/threads/${params.slug}/${params.threadId}`);
  if (!res?.success) return { title: 'Thread Not Found' };
  return {
    title: res.data.title,
    description: res.data.content?.substring(0, 160),
    openGraph: { title: res.data.title, type: 'article' },
    twitter: { card: 'summary' },
  };
}

export default async function ThreadPage({ params, searchParams }) {
  const page = searchParams?.page || '1';
  const [threadRes, commentsRes] = await Promise.all([
    api.get(`/threads/${params.slug}/${params.threadId}`),
    api.get(`/comments/thread/${params.threadId}?page=${page}`),
  ]);

  if (!threadRes?.success) notFound();

  const thread = threadRes.data;
  const comments = commentsRes?.data || [];
  const commentsMeta = commentsRes?.meta || {};

  return (
    <div className="zt6v2j">
      <div>
        {/* Breadcrumb */}
        <nav style={{ fontSize: '13px', color: 'var(--c-text-muted)', marginBottom: '16px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          <Link href="/">Home</Link>
          <span>/</span>
          <Link href="/forums">Forums</Link>
          <span>/</span>
          <Link href={`/forums/${thread.forum?.slug}`}>{thread.forum?.name}</Link>
          <span>/</span>
          <span style={{ color: 'var(--c-text-primary)' }}>{thread.title}</span>
        </nav>

        <ThreadContent thread={thread} />
        <CommentList comments={comments} meta={commentsMeta} threadId={params.threadId} slug={params.slug} page={page} />
      </div>

      {/* Sidebar */}
      <aside className="qy6e1f">
        <div className="rz8g3h">
          <h3 className="sa0i5j">Thread Info</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--c-text-secondary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Views</span><strong>{thread.viewCount}</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Replies</span><strong>{thread.commentCount}</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Reactions</span><strong>{thread.reactionCount}</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Created</span><span>{new Date(thread.createdAt).toLocaleDateString()}</span></div>
          </div>
        </div>
        {thread.tags?.length > 0 && (
          <div className="rz8g3h">
            <h3 className="sa0i5j">Tags</h3>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {thread.tags.map(t => (
                <Link key={t.tag.id} href={`/search?query=${t.tag.name}&type=threads`} className="px2c7d qy4e9f">{t.tag.name}</Link>
              ))}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
