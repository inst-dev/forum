'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { clientApi } from '@/lib/api';

export default function NewThreadPage() {
  return (<Suspense fallback={<div className="uc4m9n"><div className="tb2k7l" /></div>}><NewThreadContent /></Suspense>);
}

function NewThreadContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const forumId = searchParams.get('forum') || '';

  const [form, setForm] = useState({ title: '', content: '', type: 'DISCUSSION', forumId, tags: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const tags = form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : undefined;
    const res = await clientApi.post('/threads', { ...form, tags });
    setLoading(false);

    if (res.success) {
      router.push(`/${res.data.slug || 'thread'}/${res.data.id}`);
    } else {
      setError(res.error?.message || 'Failed to create thread');
    }
  };

  if (!user) return <div className="uc4m9n"><p>Please log in to create a thread.</p></div>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '20px' }}>Create New Thread</h1>
      {error && <div style={{ padding: '8px 12px', marginBottom: '16px', borderRadius: 'var(--c-radius-sm)', background: 'var(--c-error)', color: '#fff', fontSize: '14px' }}>{error}</div>}

      <form onSubmit={handleSubmit} className="xf6s1t ai2y7z">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="bj4a9b">
            <label className="ck6c1d">Forum ID</label>
            <input className="dl8e3f" value={form.forumId} onChange={e => setForm({ ...form, forumId: e.target.value })} required placeholder="Select a forum" />
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
          <textarea className="dl8e3f em0g5h" style={{ minHeight: '300px' }} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} required minLength={10} placeholder="Write your thread content here. Markdown is supported." />
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
