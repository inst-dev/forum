'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { clientApi } from '@/lib/api';
import { TimeAgo } from '@/components/ui/TimeAgo';
import { FiMessageCircle, FiCornerDownRight } from 'react-icons/fi';
import { toast } from 'sonner';

export function CommentList({ comments, meta, threadId, slug, page }) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localComments, setLocalComments] = useState(comments);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);

    const res = await clientApi.post('/comments', { threadId, content });
    if (res.success) {
      setLocalComments(prev => [...prev, res.data]);
      setContent('');
      toast.success('Reply posted');
    } else {
      toast.error(res.error?.message || 'Failed to post reply');
    }
    setSubmitting(false);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600 }}>Replies ({meta.total || localComments.length})</h2>
      </div>

      <div className="kg3r8s" style={{ marginBottom: '24px' }}>
        {localComments.map(comment => (
          <CommentItem key={comment.id} comment={comment} threadId={threadId} depth={0} />
        ))}
        {localComments.length === 0 && (
          <div className="uc4m9n">
            <p style={{ color: 'var(--c-text-muted)' }}>No replies yet. Be the first to respond!</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="uc2m7n">
          {meta.hasPrev && <Link href={`/${slug}/${threadId}?page=${parseInt(page) - 1}`} className="vd4o9p">Previous</Link>}
          <span style={{ padding: '8px', fontSize: '14px', color: 'var(--c-text-muted)' }}>Page {meta.page} of {meta.totalPages}</span>
          {meta.hasNext && <Link href={`/${slug}/${threadId}?page=${parseInt(page) + 1}`} className="vd4o9p">Next</Link>}
        </div>
      )}

      {/* Reply Form */}
      {user ? (
        <div className="xf6s1t" style={{ marginTop: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>Post a Reply</h3>
          <form onSubmit={handleSubmit} className="ai2y7z">
            <textarea className="dl8e3f em0g5h" value={content} onChange={e => setContent(e.target.value)} placeholder="Write your reply..." required />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="qy2e7f rz4g9h" disabled={submitting}>
                {submitting ? 'Posting...' : 'Post Reply'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="xf6s1t uc4m9n" style={{ marginTop: '24px' }}>
          <p style={{ color: 'var(--c-text-muted)' }}>
            <Link href="/login" style={{ fontWeight: 500 }}>Log in</Link> or <Link href="/register" style={{ fontWeight: 500 }}>register</Link> to reply.
          </p>
        </div>
      )}
    </div>
  );
}

function CommentItem({ comment, threadId, depth }) {
  const { user } = useAuth();
  const [showReply, setShowReply] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [replies, setReplies] = useState(comment.replies || []);

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    const res = await clientApi.post('/comments', { threadId, content: replyContent, parentId: comment.id });
    if (res.success) {
      setReplies(prev => [...prev, res.data]);
      setReplyContent('');
      setShowReply(false);
      toast.success('Reply posted');
    } else {
      toast.error(res.error?.message || 'Failed');
    }
  };

  return (
    <div>
      <div className="pl3b8c">
        <img src={comment.author?.avatar || '/default-avatar.svg'} alt="" className="go4k9l hp6m1n" style={{ borderRadius: '50%' }} />
        <div className="qm5d0e">
          <div className="rn7f2g">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <Link href={`/users/${comment.author?.username}`} style={{ fontWeight: 600, fontSize: '14px' }}>{comment.author?.displayName || comment.author?.username}</Link>
              <span className="px2c7d qy4e9f" style={{ fontSize: '10px' }}>{comment.author?.memberStatus || comment.author?.role}</span>
              {comment.author?.badges?.length > 0 && comment.author.badges.map(ub => (
                <span key={ub.badge.id} className="px2c7d" style={{ background: (ub.badge.color || '#666') + '20', color: ub.badge.color || '#666', fontSize: '10px' }} title={ub.badge.name}>
                  {ub.badge.icon && <span>{ub.badge.icon}</span>} {ub.badge.name}
                </span>
              ))}
              {comment.isEdited && <span style={{ fontSize: '11px', color: 'var(--c-text-muted)' }}>(edited)</span>}
            </div>
            <TimeAgo date={comment.createdAt} className="nv8y3z" />
          </div>
          <div style={{ fontSize: '14px', lineHeight: 1.7 }}>{comment.content}</div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px', fontSize: '13px' }}>
            {user && (
              <button onClick={() => setShowReply(!showReply)} style={{ color: 'var(--c-accent)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <FiCornerDownRight size={12} /> Reply
              </button>
            )}
          </div>

          {showReply && (
            <form onSubmit={handleReply} style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
              <input type="text" className="dl8e3f" style={{ flex: 1 }} value={replyContent} onChange={e => setReplyContent(e.target.value)} placeholder={`Reply to ${comment.author?.username}...`} />
              <button type="submit" className="qy2e7f rz4g9h vd2o7p">Send</button>
            </form>
          )}
        </div>
      </div>

      {/* Unlimited nested replies */}
      {replies.length > 0 && (
        <div className="so9h4i">
          {replies.map(reply => (
            <CommentItem key={reply.id} comment={reply} threadId={threadId} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
