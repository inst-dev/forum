import Link from 'next/link';
import { api } from '@/lib/api';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }) {
  const res = await api.get(`/users/${params.username}`);
  if (!res?.success) return { title: 'User Not Found' };
  return { title: `${res.data.displayName || res.data.username}'s Profile` };
}

export default async function ProfilePage({ params }) {
  const res = await api.get(`/users/${params.username}`);
  if (!res?.success) notFound();
  const profile = res.data;

  return (
    <div className="dz9d4e">
      {/* Banner */}
      <div style={{ height: '200px', background: profile.banner ? `url(${profile.banner}) center/cover` : 'linear-gradient(135deg, var(--c-accent), var(--c-accent-hover))', borderRadius: 'var(--c-radius-lg) var(--c-radius-lg) 0 0' }} />

      <div className="xf6s1t" style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0, marginTop: '-1px' }}>
        {/* Avatar + Name */}
        <div className="fb3h8i">
          <img src={profile.avatar || '/default-avatar.svg'} alt={profile.username} className="go4k9l jr0q5r gc5j0k" />
          <div style={{ paddingBottom: '8px' }}>
            <div className="ie9n4o">
              <h1 style={{ fontSize: '22px', fontWeight: 700 }}>{profile.displayName || profile.username}</h1>
              {profile.isVerified && <span title="Verified" style={{ color: 'var(--c-accent)' }}>✓</span>}
              <span className="px2c7d qy4e9f">{profile.role}</span>
            </div>
            <p style={{ color: 'var(--c-text-muted)', fontSize: '14px' }}>@{profile.username} &middot; {profile.memberStatus}</p>
          </div>
        </div>

        <div className="hd7l2m">
          {/* Bio */}
          {profile.bio && <p style={{ marginBottom: '12px', fontSize: '14px' }}>{profile.bio}</p>}
          {profile.statusMessage && <p style={{ fontSize: '13px', color: 'var(--c-text-muted)', marginBottom: '12px' }}>💬 {profile.statusMessage}</p>}

          {/* Badges */}
          {profile.badges?.length > 0 && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
              {profile.badges.map(b => (
                <span key={b.id} className="px2c7d" style={{ background: b.color + '20', color: b.color }} title={b.description}>{b.icon} {b.name}</span>
              ))}
            </div>
          )}

          {/* Stats */}
          <div className="jf1p6q">
            <div><strong>{profile.points}</strong><span>Points</span></div>
            <div><strong>{profile.reactionScore}</strong><span>Reactions</span></div>
            <div><strong>{profile.threadCount}</strong><span>Threads</span></div>
            <div><strong>{profile.commentCount}</strong><span>Posts</span></div>
            {profile.followerCount !== undefined && <div><strong>{profile.followerCount}</strong><span>Followers</span></div>}
            {profile.followingCount !== undefined && <div><strong>{profile.followingCount}</strong><span>Following</span></div>}
          </div>

          {/* Info */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '13px', color: 'var(--c-text-secondary)', marginTop: '12px' }}>
            {profile.location && <span>📍 {profile.location}</span>}
            <span>📅 Joined {new Date(profile.joinedAt).toLocaleDateString()}</span>
            {profile.lastSeen && <span>🕐 Last seen {new Date(profile.lastSeen).toLocaleDateString()}</span>}
            {profile.isOnline && <span style={{ color: 'var(--c-success)' }}>● Online</span>}
          </div>

          {/* Social Links */}
          {profile.socialLinks && Object.values(profile.socialLinks).some(v => v) && (
            <div style={{ display: 'flex', gap: '12px', marginTop: '12px', fontSize: '13px' }}>
              {profile.socialLinks.website && <a href={profile.socialLinks.website} target="_blank" rel="noopener noreferrer">🌐 Website</a>}
              {profile.socialLinks.twitter && <a href={`https://twitter.com/${profile.socialLinks.twitter}`} target="_blank" rel="noopener noreferrer">𝕏 Twitter</a>}
              {profile.socialLinks.github && <a href={`https://github.com/${profile.socialLinks.github}`} target="_blank" rel="noopener noreferrer">GitHub</a>}
              {profile.socialLinks.discord && <span>Discord: {profile.socialLinks.discord}</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
