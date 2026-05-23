'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { clientApi } from '@/lib/api';

export function ThreadContent({ thread }) {
  const { user } = useAuth();
  const [bookmarked, setBookmarked] = useState(false);
  const [watching, setWatching] = useState(false);

  const handleBookmark = async () => {
    const res = await clientApi.post(`/threads/${thread.id}/bookmark`);
    if (res.success) setBookmarked(res.data.bookmarked);
  };

  const handleWatch = async () => {
    const res = await clientApi.post(`/threads/${thread.id}/watch`);
    if (res.success) setWatching(res.data.watching);
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
            <time>{new Date(thread.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</time>
          </div>
          {user && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleBookmark} className={`qy2e7f vd2o7p ${bookmarked ? 'rz4g9h' : 'tb8k3l'}`}>
                {bookmarked ? 'Bookmarked' : 'Bookmark'}
              </button>
              <button onClick={handleWatch} className={`qy2e7f vd2o7p ${watching ? 'rz4g9h' : 'tb8k3l'}`}>
                {watching ? 'Watching' : 'Watch'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Author Info */}
      <div className="nj9x4y">
        <img src={thread.author?.avatar || '/default-avatar.svg'} alt="" className="go4k9l iq8o3p" />
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Link href={`/users/${thread.author?.username}`} style={{ fontWeight: 600 }}>{thread.author?.displayName || thread.author?.username}</Link>
            <span className="px2c7d qy4e9f">{thread.author?.memberStatus}</span>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--c-text-muted)' }}>
            Points: {thread.author?.points} &middot; Reactions: {thread.author?.reactionScore} &middot; Joined: {new Date(thread.author?.createdAt).toLocaleDateString()}
          </div>
          {thread.author?.badges?.length > 0 && (
            <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
              {thread.author.badges.map(b => (
                <span key={b.badge.id} className="px2c7d" style={{ background: b.badge.color + '20', color: b.badge.color }}>{b.badge.name}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Thread Content */}
      <div className="ok1z6a" dangerouslySetInnerHTML={{ __html: thread.content }} />

      {/* Poll */}
      {thread.poll && <PollWidget poll={thread.poll} threadId={thread.id} user={user} />}

      {/* Reactions & Actions */}
      <div style={{ padding: '12px 24px', borderTop: '1px solid var(--c-border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <ReactionBar targetType="THREAD" targetId={thread.id} />
        <div style={{ display: 'flex', gap: '8px', fontSize: '13px', color: 'var(--c-text-muted)' }}>
          <span>{thread.viewCount} views</span>
          <span>&middot;</span>
          <span>{thread.commentCount} replies</span>
        </div>
      </div>

      {/* Signature */}
      {thread.author?.signature && (
        <div style={{ padding: '12px 24px', borderTop: '1px solid var(--c-border-light)', fontSize: '13px', color: 'var(--c-text-muted)', fontStyle: 'italic' }}>
          {thread.author.signature}
        </div>
      )}
    </div>
  );
}

function ReactionBar({ targetType, targetId }) {
  const { user } = useAuth();
  const [reacted, setReacted] = useState(null);

  const reactions = [
    { type: 'like', emoji: '👍' },
    { type: 'love', emoji: '❤️' },
    { type: 'funny', emoji: '😂' },
    { type: 'helpful', emoji: '💡' },
    { type: 'sad', emoji: '😢' },
    { type: 'angry', emoji: '😡' },
  ];

  const handleReact = async (type) => {
    if (!user) return;
    const res = await clientApi.post('/reactions', { targetType, targetId, reactionType: type });
    if (res.success) {
      setReacted(res.data.action === 'added' ? type : null);
    }
  };

  return (
    <div className="nv0y5z">
      {reactions.map(r => (
        <button key={r.type} onClick={() => handleReact(r.type)} className={`ow2a7b ${reacted === r.type ? 'px4c9d' : ''}`} title={r.type}>
          {r.emoji}
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
    if (res.success) setVoted(true);
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
        <button onClick={handleVote} className="qy2e7f rz4g9h vd2o7p" style={{ marginTop: '8px' }}>
          Vote
        </button>
      )}
      <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--c-text-muted)' }}>
        {poll.totalVotes} votes
        {poll.expiresAt && ` · Expires ${new Date(poll.expiresAt).toLocaleDateString()}`}
      </div>
    </div>
  );
}
