'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { clientApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { FiUserPlus, FiUserCheck, FiMessageSquare, FiUserX, FiUserMinus } from 'react-icons/fi';

export function ProfileActions({ profileId, profileUsername }) {
  const { user } = useAuth();
  const router = useRouter();
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingFollow, setCheckingFollow] = useState(true);

  // Check follow status on mount
  useEffect(() => {
    if (!user || user.id === profileId) { setCheckingFollow(false); return; }
    async function checkFollowStatus() {
      try {
        const res = await clientApi.get(`/users/${profileId}/followers?limit=100`);
        if (res.success && res.data) {
          const isFollowing = res.data.some(f => f.id === user.id);
          setFollowing(isFollowing);
        }
      } catch {}
      setCheckingFollow(false);
    }
    checkFollowStatus();
  }, [user, profileId]);

  if (!user || user.id === profileId) return null;
  if (checkingFollow) return null;

  const handleFollow = async () => {
    setLoading(true);
    const res = await clientApi.post(`/users/${profileId}/follow`, {});
    if (res.success) {
      setFollowing(res.data.following);
      toast.success(res.data.following ? `Following @${profileUsername}` : `Unfollowed @${profileUsername}`);
    } else {
      toast.error(res.error?.message || 'Failed');
    }
    setLoading(false);
  };

  const handleMessage = () => {
    router.push(`/messages/${profileUsername}`);
  };

  const handleBlock = async () => {
    if (!confirm(`Block @${profileUsername}? They won't be able to see your profile or message you.`)) return;
    const res = await clientApi.post(`/users/${profileId}/block`, {});
    if (res.success) {
      toast.success(res.data.blocked ? 'User blocked' : 'User unblocked');
    }
  };

  return (
    <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
      <button onClick={handleFollow} disabled={loading} className={`qy2e7f ${following ? 'tb8k3l' : 'rz4g9h'}`} style={{ fontSize: '14px' }}>
        {following ? <><FiUserMinus size={16} /> Unfollow</> : <><FiUserPlus size={16} /> Follow</>}
      </button>
      <button onClick={handleMessage} className="qy2e7f sa6i1j" style={{ fontSize: '14px' }}>
        <FiMessageSquare size={16} /> Message
      </button>
      <button onClick={handleBlock} className="qy2e7f tb8k3l" style={{ fontSize: '14px', color: 'var(--c-text-muted)' }}>
        <FiUserX size={16} />
      </button>
    </div>
  );
}
