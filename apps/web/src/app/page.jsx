import Link from 'next/link';
import { api } from '@/lib/api';
import { TimeAgo } from '@/components/ui/TimeAgo';
import { buildThreadUrl } from '@/lib/thread-url';
import { SuggestedThreads } from '@/components/thread/SuggestedThreads';

export const metadata = {
  title: 'Home',
  description: 'Community forum - discover discussions and connect with members',
};

async function getHomeData() {
  try {
    const [categoriesRes, threadsRes] = await Promise.all([
      api.get('/forums/categories'),
      api.get('/threads?limit=20&sort=active'),
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
      {/* Main Feed - Latest + Recommended mixed like a social feed */}
      <div className="pm5k8w">
        <section className="xf6s1t" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--c-border-light)' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600 }}>Feed</h2>
            <div style={{ display: 'flex', gap: '12px', fontSize: '13px' }}>
              <Link href="/threads" className="ox7a3b">Latest</Link>
              <Link href="/threads?sort=popular" className="ox7a3b">Popular</Link>
            </div>
          </div>
          <div>
            {threads.map((thread) => (
              <Link href={buildThreadUrl(thread.slug, thread.id)} key={thread.id} className="ks2s7t">
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

        {/* AI Recommended Section */}
        <SuggestedThreads />
      </div>

      {/* Sidebar - Stats, Categories, Online Users */}
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

        {/* Forum Categories */}
        {categories.map((category) => (
          <div key={category.id} className="rz8g3h">
            <h3 className="sa0i5j">{category.name}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {category.forums?.map((forum) => (
                <Link href={`/forums/${forum.slug}`} key={forum.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 8px', borderRadius: 'var(--c-radius-sm)', fontSize: '13px', transition: 'background 0.15s' }} className="zh0w5x">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{forum.icon}</span>
                    <span style={{ fontWeight: 500, color: 'var(--c-text-primary)' }}>{forum.name}</span>
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--c-text-muted)', background: 'var(--c-bg-tertiary)', padding: '2px 6px', borderRadius: '10px' }}>{forum.threadCount}</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </aside>
    </div>
  );
}
