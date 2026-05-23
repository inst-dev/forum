'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { clientApi } from '@/lib/api';

const TAG_COLORS = ['#1a73e8', '#e91e63', '#9c27b0', '#00bcd4', '#ff9800', '#4caf50', '#f44336', '#3f51b5', '#009688', '#ff5722'];

function getTagColor(tag) {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
}

export default function NewThreadPage() {
  return (<Suspense fallback={<div className="uc4m9n"><div className="tb2k7l" /></div>}><NewThreadContent /></Suspense>);
}

function NewThreadContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const forumId = searchParams.get('forum') || '';

  const [form, setForm] = useState({ title: '', content: '', type: 'DISCUSSION', forumId });
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const addTag = (value) => {
    const tag = value.trim().toLowerCase();
    if (tag && !tags.includes(tag) && tags.length < 5) {
      setTags([...tags, tag]);
    }
    setTagInput('');
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleTagKeyDown = (e) => {
    if (e.key === ',' || e.key === 'Enter') {
      e.preventDefault();
      addTag(tagInput);
    } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      setTags(tags.slice(0, -1));
    }
  };

  const handleTagInput = (e) => {
    const value = e.target.value;
    if (value.includes(',')) {
      const parts = value.split(',');
      parts.forEach((part, idx) => {
        if (idx < parts.length - 1) addTag(part);
      });
      setTagInput(parts[parts.length - 1]);
    } else {
      setTagInput(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const payload = {
      forumId: form.forumId,
      title: form.title,
      content: form.content,
      type: form.type,
    };

    if (tags.length > 0) {
      payload.tags = tags.slice(0, 5);
    }

    const res = await clientApi.post('/threads', payload);
    setLoading(false);

    if (res.success) {
      router.push(`/${res.data.slug || 'thread'}/${res.data.id.substring(0, 8)}`);
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
          <label className="ck6c1d">Tags {tags.length > 0 && <span style={{ color: 'var(--c-text-muted)', fontWeight: 400 }}>({tags.length}/5)</span>}</label>
          <div className="tg1c8w">
            {tags.map(tag => (
              <span key={tag} className="tg2d9x" style={{ background: getTagColor(tag) + '20', color: getTagColor(tag), borderColor: getTagColor(tag) + '40' }}>
                {tag}
                <button type="button" onClick={() => removeTag(tag)} className="tg3e0y" style={{ color: getTagColor(tag) }} aria-label={`Remove ${tag}`}>&times;</button>
              </span>
            ))}
            {tags.length < 5 && (
              <input
                className="tg4f1z"
                value={tagInput}
                onChange={handleTagInput}
                onKeyDown={handleTagKeyDown}
                onBlur={() => tagInput && addTag(tagInput)}
                placeholder={tags.length === 0 ? 'Type tag and press comma or Enter...' : 'Add more...'}
              />
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button type="button" className="qy2e7f tb8k3l" onClick={() => router.back()}>Cancel</button>
          <button type="submit" className="qy2e7f rz4g9h" disabled={loading}>{loading ? 'Creating...' : 'Create Thread'}</button>
        </div>
      </form>
    </div>
  );
}
