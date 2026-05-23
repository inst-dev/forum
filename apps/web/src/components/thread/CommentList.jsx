'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { clientApi } from '@/lib/api';
import { TimeAgo } from '@/components/ui/TimeAgo';
import { ReactionBar } from './ThreadContent';
import { FiCornerDownRight, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { toast } from 'sonner';

const MAX_NESTING_DEPTH = 4;

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

      {meta.totalPages > 1 && (
        <div className="uc2m7n">
          {meta.hasPrev && <Link href={`/${slug}/${threadId}?page=${parseInt(page) - 1}`} className="vd4o9p">Previous</Link>}
          <span style={{ padding: '8px', fontSize: '14px', color: 'var(--c-text-muted)' }}>Page {meta.page} of {meta.totalPages}</span>
          {meta.hasNext && <Link href={`/${slug}/${threadId}?page=${parseInt(page) + 1}`} className="vd4o9p">Next</Link>}
        </div>
      )}

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
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [currentContent, setCurrentContent] = useState(comment.content);
  const [isEdited, setIsEdited] = useState(comment.isEdited);
  const [isDeleted, setIsDeleted] = useState(false);

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

  const handleEdit = async () => {
    if (!editContent.trim()) return;
    const res = await clientApi.put(`/comments/${comment.id}`, { content: editContent });
    if (res.success) {
      setCurrentContent(editContent);
      setIsEdited(true);
      setEditing(false);
      toast.success('Comment updated');
    } else {
      toast.error(res.error?.message || 'Failed to update');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    const res = await clientApi.delete(`/comments/${comment.id}`);
    if (res.success) {
      setIsDeleted(true);
      toast.success('Comment deleted');
    } else {
      toast.error('Failed to delete');
    }
  };

  if (isDeleted) {
    return (
      <div className="pl3b8c" style={{ opacity: 0.5 }}>
        <div style={{ fontSize: '13px', color: 'var(--c-text-muted)', fontStyle: 'italic' }}>This comment has been deleted.</div>
      </div>
    );
  }

  // Limit indentation - after MAX_NESTING_DEPTH, render flat
  const indent = Math.min(depth, MAX_NESTING_DEPTH);

  return (
    <div>
      <div className="pl3b8c" style={{ marginLeft: indent > 0 ? `${indent * 24}px` : 0, borderLeft: indent > 0 ? '2px solid var(--c-border-light)' : 'none', paddingLeft: indent > 0 ? '16px' : '24px' }}>
        <img src={comment.author?.avatar || '/default-avatar.svg'} alt="" className="go4k9l hp6m1n" style={{ borderRadius: '50%' }} />
        <div className="qm5d0e">
          <div className="rn7f2g">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Link href={`/users/${comment.author?.username}`} style={{ fontWeight: 600, fontSize: '14px' }}>{comment.author?.displayName || comment.author?.username}</Link>
              <span className="px2c7d qy4e9f" style={{ fontSize: '10px' }}>{comment.author?.memberStatus || comment.author?.role}</span>
              {isEdited && <span style={{ fontSize: '11px', color: 'var(--c-warning)', fontWeight: 500 }}>edited</span>}
            </div>
            <TimeAgo date={comment.createdAt} className="nv8y3z" />
          </div>

          {editing ? (
            <div style={{ marginTop: '8px' }}>
              <textarea className="dl8e3f" style={{ width: '100%', minHeight: '80px' }} value={editContent} onChange={e => setEditContent(e.target.value)} />
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button onClick={handleEdit} className="qy2e7f rz4g9h vd2o7p">Save</button>
                <button onClick={() => setEditing(false)} className="qy2e7f tb8k3l vd2o7p">Cancel</button>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '14px', lineHeight: 1.7, marginTop: '4px' }}>{currentContent}</div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px', fontSize: '13px', alignItems: 'center' }}>
            {user && !editing && (
              <>
                <button onClick={() => setShowReply(!showReply)} style={{ color: 'var(--c-accent)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <FiCornerDownRight size={12} /> Reply
                </button>
                {user.id === comment.author?.id && (
                  <>
                    <button onClick={() => setEditing(true)} style={{ color: 'var(--c-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <FiEdit2 size={12} /> Edit
                    </button>
                    <button onClick={handleDelete} style={{ color: 'var(--c-error)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <FiTrash2 size={12} /> Delete
                    </button>
                  </>
                )}
              </>
            )}
          </div>

          {/* Reaction bar for comments */}
          <div style={{ marginTop: '6px' }}>
            <ReactionBar targetType="COMMENT" targetId={comment.id} />
          </div>

          {showReply && (
            <form onSubmit={handleReply} style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
              <input type="text" className="dl8e3f" style={{ flex: 1 }} value={replyContent} onChange={e => setReplyContent(e.target.value)} placeholder={`Reply to ${comment.author?.username}...`} />
              <button type="submit" className="qy2e7f rz4g9h vd2o7p">Send</button>
            </form>
          )}
        </div>
      </div>

      {/* Nested replies */}
      {replies.length > 0 && replies.map(reply => (
        <CommentItem key={reply.id} comment={reply} threadId={threadId} depth={depth + 1} />
      ))}
    </div>
  );
}
