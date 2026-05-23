import Link from 'next/link';
import { api } from '@/lib/api';

export const metadata = { title: 'Announcements' };

export default async function AnnouncementsPage() {
  const res = await api.get('/threads?limit=20&sort=latest');
  const threads = (res?.data || []).filter(t => t.type === 'ANNOUNCEMENT' || t.isPinned);

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '20px' }}>Announcements</h1>
      <div className="xf6s1t" style={{ padding: 0, overflow: 'hidden' }}>
        {threads.map(thread => (
          <Link href={`/${thread.slug}/${thread.id}`} key={thread.id} className="ks2s7t">
            <div className="lt4u9v">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="px2c7d sa8i3j">Announcement</span>
                <h3 className="mu6w1x">{thread.title}</h3>
              </div>
              <div className="nv8y3z">
                <span>{thread.author?.username}</span>
                <span>&middot;</span>
                <time>{new Date(thread.createdAt).toLocaleDateString()}</time>
              </div>
            </div>
          </Link>
        ))}
        {threads.length === 0 && <div className="uc4m9n"><p style={{ color: 'var(--c-text-muted)' }}>No announcements yet.</p></div>}
      </div>
    </div>
  );
}
