'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { clientApi } from '@/lib/api';
import { RichEditor } from '@/components/ui/RichEditor';
import { ForumSelector } from '@/components/ui/ForumSelector';
import { buildThreadUrl } from '@/lib/thread-url';
import { toast } from 'sonner';

export default function NewThreadPage() {
  return (<Suspense fallback={<div className="uc4m9n"><div className="tb2k7l" /></div>}><NewThreadContent /></Suspense>);
}

function NewThreadContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialForumId = searchParams.get('forum') || '';

  const [form, setForm] = useState({ title: '', content: '', type: 'DISCUSSION', forumId: initialForumId, tags: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.forumId) { toast.error('Please select a forum'); return; }
    if (form.title.length < 5) { toast.error('Title must be at least 5 characters'); return; }
    if (form.content.length < 10) { toast.error('Content must be at least 10 characters'); return; }

    setLoading(true);
    const tags = form.tags ? form.tags.split(',').map(t => t.trim()).filter(t => t.length > 0) : undefined;
    const payload = { forumId: form.forumId, title: form.title, content: form.content, type: form.type };
    if (tags && tags.length > 0) payload.tags = tags;
    const res = await clientApi.post('/threads', payload);
    setLoading(false);

    if (res.success) {
      toast.success('Thread created!');
      router.push(buildThreadUrl(res.data.slug || 'thread', res.data.id));
    } else {
      toast.error(res.error?.message || 'Failed to create thread');
    }
  };

  if (!user) return <div className="uc4m9n"><p>Please log in to create a thread.</p></div>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '20px' }}>Create New Thread</h1>

      <form onSubmit={handleSubmit} className="xf6s1t ai2y7z">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="bj4a9b">
            <label className="ck6c1d">Forum</label>
            <ForumSelector value={form.forumId} onChange={v => setForm({ ...form, forumId: v })} />
          </div>
          <div className="bj4a9b">
            <label className="ck6c1d">Type</label>
            <select className="dl8e3f" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              <option value="DISCUSSION">Discussion</option>
              <option value="QUESTION">Question</option>
              <option value="POLL">Poll</option>
              <option value="ANNOUNCEMENT">Announcement</option>
            </select>
          </div>
        </div>
        <div className="bj4a9b">
          <label className="ck6c1d">Title</label>
          <input className="dl8e3f" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required minLength={5} maxLength={200} placeholder="Thread title" />
        </div>
        <div className="bj4a9b">
          <label className="ck6c1d">Content</label>
          <RichEditor value={form.content} onChange={v => setForm({ ...form, content: v })} placeholder="Write your thread content here..." />
        </div>
        <div className="bj4a9b">
          <label className="ck6c1d">Tags (comma separated)</label>
          <input className="dl8e3f" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="nextjs, react, tutorial" />
        </div>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button type="button" className="qy2e7f tb8k3l" onClick={() => router.back()}>Cancel</button>
          <button type="submit" className="qy2e7f rz4g9h" disabled={loading}>{loading ? 'Creating...' : 'Create Thread'}</button>
        </div>
      </form>
    </div>
  );
}
