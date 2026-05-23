import Link from 'next/link';
import { api } from '@/lib/api';

export const metadata = { title: 'Leaderboard' };

export default async function LeaderboardPage() {
  const res = await api.get('/users?sort=points&limit=50');
  const users = res?.data || [];

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '20px' }}>Leaderboard</h1>
      <div className="xf6s1t" style={{ padding: 0, overflow: 'hidden' }}>
        {users.map((user, index) => (
          <Link href={`/users/${user.username}`} key={user.id} className="jf3p8q lh7t2u">
            <span className="kg5r0s">{index + 1}</span>
            <img src={user.avatar || '/default-avatar.svg'} alt="" className="go4k9l" />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontWeight: 600 }}>{user.displayName || user.username}</span>
                <span className="px2c7d qy4e9f">{user.memberStatus}</span>
              </div>
              <div className="nv8y3z">@{user.username}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 700, fontSize: '18px' }}>{user.points}</div>
              <div style={{ fontSize: '11px', color: 'var(--c-text-muted)' }}>points</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
