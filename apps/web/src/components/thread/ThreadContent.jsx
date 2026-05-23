'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { clientApi } from '@/lib/api';
import { TimeAgo } from '@/components/ui/TimeAgo';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { FiBookmark, FiEye, FiMessageCircle, FiHeart } from 'react-icons/fi';
import { AiOutlineLike, AiFillLike, AiOutlineHeart, AiFillHeart } from 'react-icons/ai';
import { BsEmojiLaughing, BsLightbulb, BsEmojiFrown, BsEmojiAngry } from 'react-icons/bs';
import { toast } from 'sonner';

export function ThreadContent({ thread }) {
  const { user } = useAuth();
  const [bookmarked, setBookmarked] = useState(false);
  const [watching, setWatching] = useState(false);

  const handleBookmark = async () => {
    const res = await clientApi.post(`/threads/${thread.id}/bookmark`);
    if (res.success) {
      setBookmarked(res.data.bookmarked);
      toast.success(res.data.bookmarked ? 'Bookmarked' : 'Removed from bookmarks');
    }
  };

  const handleWatch = async () => {
    const res = await clientApi.post(`/threads/${thread.id}/watch`);
    if (res.success) {
      setWatching(res.data.watching);
      toast.success(res.data.watching ? 'Now watching' : 'Stopped watching');
    }
  };

  return (
    <div className="kg3r8s" style={{ marginBottom: '24px' }}>
      {/* Thread Header */}
      <div className="lh5t0u">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
          {thread.prefix && <span className="px2c7d" style={{ background: thread.prefix.color + '20', color: thread.prefix.color }}>{thread.prefix.name}</span>}
          {thread.isPinned && <span className="px2c7d sa8i3j">Pinned</span>}
          {thread.isLocked && <span className="px2c7d tb0k5l">Locked</span>}
          {thread.status === 'SOLVED' && <span className="px2c7d rz6g1h">Solved</span>}
        </div>
        <h1 className="mi7v2w">{thread.title}</h1>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div className="nv8y3z">
            <span>by <Link href={`/users/${thread.author?.username}`} style={{ fontWeight: 500, color: 'var(--c-text-primary)' }}>{thread.author?.username}</Link></span>
            <span>&middot;</span>
            <TimeAgo date={thread.createdAt} />
          </div>
          {user && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleBookmark} className={`qy2e7f vd2o7p ${bookmarked ? 'rz4g9h' : 'tb8k3l'}`}>
                <FiBookmark size={14} /> {bookmarked ? 'Bookmarked' : 'Bookmark'}
              </button>
              <button onClick={handleWatch} className={`qy2e7f vd2o7p ${watching ? 'rz4g9h' : 'tb8k3l'}`}>
                <FiEye size={14} /> {watching ? 'Watching' : 'Watch'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Author Info */}
      <div className="nj9x4y">
        <img src={thread.author?.avatar || '/default-avatar.svg'} alt="" className="go4k9l iq8o3p" style={{ borderRadius: '50%' }} />
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <Link href={`/users/${thread.author?.username}`} style={{ fontWeight: 600 }}>{thread.author?.displayName || thread.author?.username}</Link>
            {thread.author?.isVerified && <VerifiedBadge />}
            <span className="px2c7d qy4e9f">{thread.author?.memberStatus}</span>
            {thread.author?.badges?.length > 0 && thread.author.badges.map(ub => (
              <span key={ub.badge.id} className="px2c7d" style={{ background: (ub.badge.color || '#666') + '20', color: ub.badge.color || '#666', fontSize: '10px' }} title={ub.badge.description || ub.badge.name}>
                {ub.badge.icon && <span style={{ marginRight: '2px' }}>{ub.badge.icon}</span>}
                {ub.badge.name}
              </span>
            ))}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--c-text-muted)' }}>
            Points: {thread.author?.points} &middot; Reactions: {thread.author?.reactionScore} &middot; Joined: <TimeAgo date={thread.author?.createdAt} />
          </div>
        </div>
      </div>

      {/* Thread Content */}
      <div className="ok1z6a" dangerouslySetInnerHTML={{ __html: thread.content }} />

      {/* Poll */}
      {thread.poll && <PollWidget poll={thread.poll} threadId={thread.id} user={user} />}

      {/* Reactions & Actions */}
      <div style={{ padding: '12px 24px', borderTop: '1px solid var(--c-border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <ReactionBar targetType="THREAD" targetId={thread.id} />
        <div style={{ display: 'flex', gap: '12px', fontSize: '13px', color: 'var(--c-text-muted)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><FiEye size={14} /> {thread.viewCount}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><FiMessageCircle size={14} /> {thread.commentCount}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><FiHeart size={14} /> {thread.reactionCount}</span>
        </div>
      </div>
    </div>
  );
}

function ReactionBar({ targetType, targetId }) {
  const { user } = useAuth();
  const [reacted, setReacted] = useState(null);
  const [counts, setCounts] = useState({});

  const reactions = [
    { type: 'like', icon: <AiOutlineLike size={16} />, activeIcon: <AiFillLike size={16} />, label: 'Like' },
    { type: 'love', icon: <AiOutlineHeart size={16} />, activeIcon: <AiFillHeart size={16} />, label: 'Love' },
    { type: 'funny', icon: <BsEmojiLaughing size={16} />, activeIcon: <BsEmojiLaughing size={16} />, label: 'Funny' },
    { type: 'helpful', icon: <BsLightbulb size={16} />, activeIcon: <BsLightbulb size={16} />, label: 'Helpful' },
    { type: 'sad', icon: <BsEmojiFrown size={16} />, activeIcon: <BsEmojiFrown size={16} />, label: 'Sad' },
    { type: 'angry', icon: <BsEmojiAngry size={16} />, activeIcon: <BsEmojiAngry size={16} />, label: 'Angry' },
  ];

  const handleReact = async (type) => {
    if (!user) {
      toast.error('Please log in to react');
      return;
    }
    const res = await clientApi.post('/reactions', { targetType, targetId, reactionType: type });
    if (res.success) {
      if (res.data.action === 'added') {
        setReacted(type);
        setCounts(prev => ({ ...prev, [type]: (prev[type] || 0) + 1 }));
      } else {
        setReacted(null);
        setCounts(prev => ({ ...prev, [type]: Math.max(0, (prev[type] || 0) - 1) }));
      }
    }
  };

  return (
    <div className="nv0y5z">
      {reactions.map(r => (
        <button key={r.type} onClick={() => handleReact(r.type)} className={`ow2a7b ${reacted === r.type ? 'px4c9d' : ''}`} title={r.label}>
          {reacted === r.type ? r.activeIcon : r.icon}
          {counts[r.type] > 0 && <span>{counts[r.type]}</span>}
        </button>
      ))}
    </div>
  );
}

function PollWidget({ poll, threadId, user }) {
  const [voted, setVoted] = useState(false);
  const [selected, setSelected] = useState([]);

  const handleVote = async () => {
    if (!user || selected.length === 0) return;
    const res = await clientApi.post(`/threads/${threadId}/poll/vote`, { optionIds: selected });
    if (res.success) {
      setVoted(true);
      toast.success('Vote recorded');
    } else {
      toast.error(res.error?.message || 'Failed to vote');
    }
  };

  const totalVotes = poll.totalVotes || 1;

  return (
    <div className="mi9v4w" style={{ margin: '0 24px 16px' }}>
      <h3 className="nj1x6y" style={{ fontSize: '15px', fontWeight: 600 }}>{poll.question}</h3>
      <div>
        {poll.options.map(opt => (
          <div key={opt.id} className="ok3z8a" onClick={() => !voted && setSelected(prev => poll.allowMultiple ? [...prev, opt.id] : [opt.id])}>
            <div className="pl5b0c" style={{ width: voted ? `${(opt.voteCount / totalVotes) * 100}%` : '0%' }} />
            <div className="qm7d2e">
              <span>{opt.text}</span>
              {voted && <span>{Math.round((opt.voteCount / totalVotes) * 100)}%</span>}
            </div>
          </div>
        ))}
      </div>
      {!voted && user && (
        <button onClick={handleVote} className="qy2e7f rz4g9h vd2o7p" style={{ marginTop: '8px' }}>Vote</button>
      )}
      <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--c-text-muted)' }}>
        {poll.totalVotes} votes {poll.expiresAt && ` · Expires ${new Date(poll.expiresAt).toLocaleDateString()}`}
      </div>
    </div>
  );
}
