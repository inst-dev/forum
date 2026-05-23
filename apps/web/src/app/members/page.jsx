import Link from 'next/link';
import { api } from '@/lib/api';

export const metadata = { title: 'Members' };

export default async function MembersPage({ searchParams }) {
  const page = searchParams?.page || '1';
  const sort = searchParams?.sort || 'newest';

  const res = await api.get(`/users?page=${page}&limit=20&sort=${sort}`);
  const users = res?.data || [];
  const meta = res?.meta || {};

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Members</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link href="/members?sort=newest" className={`qy2e7f vd2o7p ${sort === 'newest' ? 'rz4g9h' : 'tb8k3l'}`}>Newest</Link>
          <Link href="/members?sort=points" className={`qy2e7f vd2o7p ${sort === 'points' ? 'rz4g9h' : 'tb8k3l'}`}>Top Points</Link>
          <Link href="/members?sort=reactions" className={`qy2e7f vd2o7p ${sort === 'reactions' ? 'rz4g9h' : 'tb8k3l'}`}>Top Reactions</Link>
        </div>
      </div>

      <div className="xf6s1t" style={{ padding: 0, overflow: 'hidden' }}>
        {users.map(user => (
          <Link href={`/users/${user.username}`} key={user.id} className="ks2s7t">
            <img src={user.avatar || '/default-avatar.svg'} alt="" className="go4k9l" />
            <div className="lt4u9v">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="mu6w1x">{user.displayName || user.username}</span>
                {user.isVerified && <span style={{ color: 'var(--c-accent)' }}>✓</span>}
                <span className="px2c7d qy4e9f">{user.memberStatus}</span>
              </div>
              <div className="nv8y3z">
                <span>@{user.username}</span>
                <span>&middot;</span>
                <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="ow0a5b">
              <div style={{ textAlign: 'center' }}><strong>{user.points}</strong><br /><span style={{ fontSize: '11px' }}>points</span></div>
              <div style={{ textAlign: 'center' }}><strong>{user.reactionScore}</strong><br /><span style={{ fontSize: '11px' }}>reactions</span></div>
            </div>
          </Link>
        ))}
      </div>

      {meta.totalPages > 1 && (
        <div className="uc2m7n">
          {parseInt(page) > 1 && <Link href={`/members?page=${parseInt(page) - 1}&sort=${sort}`} className="vd4o9p">Previous</Link>}
          <span style={{ padding: '8px', fontSize: '14px', color: 'var(--c-text-muted)' }}>Page {page} of {meta.totalPages}</span>
          {parseInt(page) < meta.totalPages && <Link href={`/members?page=${parseInt(page) + 1}&sort=${sort}`} className="vd4o9p">Next</Link>}
        </div>
      )}
    </div>
  );
}
