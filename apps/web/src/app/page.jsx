import Link from 'next/link';
import { api } from '@/lib/api';
import { TimeAgo } from '@/components/ui/TimeAgo';
import { SuggestedThreads } from '@/components/thread/SuggestedThreads';

export const metadata = {
  title: 'Home',
  description: 'Community forum - discover discussions and connect with members',
};

async function getHomeData() {
  try {
    const [categoriesRes, threadsRes] = await Promise.all([
      api.get('/forums/categories'),
      api.get('/threads?limit=15&sort=active'),
    ]);
    return {
      categories: categoriesRes?.data || [],
      threads: threadsRes?.data || [],
    };
  } catch {
    return { categories: [], threads: [] };
  }
}

export default async function HomePage() {
  const { categories, threads } = await getHomeData();

  return (
    <div className="zt6v2j">
      <div className="pm5k8w">
        {/* Latest Threads FIRST */}
        <section className="xf6s1t" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--c-border-light)' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600 }}>Latest Discussions</h2>
            <Link href="/threads" className="ox7a3b" style={{ fontSize: '14px' }}>View all</Link>
          </div>
          <div>
            {threads.map((thread) => (
              <Link href={`/${thread.slug}/${thread.id.substring(0, 8)}`} key={thread.id} className="ks2s7t">
                <img src={thread.author?.avatar || '/default-avatar.svg'} alt="" className="go4k9l hp6m1n" style={{ borderRadius: '50%' }} />
                <div className="lt4u9v">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {thread.prefix && <span className="px2c7d qy4e9f" style={{ background: thread.prefix.color + '20', color: thread.prefix.color }}>{thread.prefix.name}</span>}
                    {thread.isPinned && <span className="px2c7d sa8i3j">Pinned</span>}
                    <h3 className="mu6w1x">{thread.title}</h3>
                  </div>
                  <div className="nv8y3z">
                    <span>{thread.author?.username}</span>
                    <span>&middot;</span>
                    <span>{thread.forum?.name}</span>
                    <span>&middot;</span>
                    <TimeAgo date={thread.lastCommentAt || thread.createdAt} />
                    {thread.tags?.length > 0 && (
                      <>
                        <span>&middot;</span>
                        {thread.tags.slice(0, 3).map(t => (
                          <span key={t.tag.id} className="tg5g2a" style={{ background: 'var(--c-accent-light)', color: 'var(--c-accent)', borderColor: 'var(--c-accent)' }}>{t.tag.name}</span>
                        ))}
                      </>
                    )}
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
                <p style={{ color: 'var(--c-text-muted)' }}>No threads yet. Be the first to create one!</p>
              </div>
            )}
          </div>
        </section>

        {/* Suggested For You (X-algorithm powered) */}
        <SuggestedThreads />

        {/* Categories */}
        {categories.map((category) => (
          <section key={category.id} className="xf6s1t">
            <h2 className="yg8u3v" style={{ fontSize: '16px', fontWeight: 600 }}>{category.name}</h2>
            <div>
              {category.forums?.map((forum) => (
                <Link href={`/forums/${forum.slug}`} key={forum.id} className="zh0w5x" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span className="mu6w1x">{forum.icon} {forum.name}</span>
                    {forum.description && <p className="nv8y3z">{forum.description}</p>}
                  </div>
                  <div className="ow0a5b">
                    <span>{forum.threadCount} threads</span>
                    <span>{forum.commentCount} posts</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Sidebar */}
      <aside className="qy6e1f">
        <div className="rz8g3h">
          <h3 className="sa0i5j">Forum Stats</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: 'var(--c-text-secondary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Threads</span><strong>{threads.length}</strong></div>
          </div>
        </div>
        <div className="rz8g3h">
          <h3 className="sa0i5j">Online Users</h3>
          <p style={{ fontSize: '13px', color: 'var(--c-text-muted)' }}>Members viewing the forum</p>
        </div>
      </aside>
    </div>
  );
}
