'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { clientApi } from '@/lib/api';

export default function AdminForumsPage() {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [catForm, setCatForm] = useState({ name: '', description: '' });
  const [forumForm, setForumForm] = useState({ name: '', description: '', categoryId: '', icon: '' });

  useEffect(() => { loadForums(); }, []);

  const loadForums = async () => {
    const res = await clientApi.get('/forums/categories');
    if (res.success) setCategories(res.data);
  };

  const createCategory = async (e) => {
    e.preventDefault();
    await clientApi.post('/forums/categories', catForm);
    setCatForm({ name: '', description: '' });
    loadForums();
  };

  const createForum = async (e) => {
    e.preventDefault();
    await clientApi.post('/forums', forumForm);
    setForumForm({ name: '', description: '', categoryId: '', icon: '' });
    loadForums();
  };

  if (!user || user.role !== 'ADMIN') return <div className="uc4m9n"><p>Access denied.</p></div>;

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '20px' }}>Forum Management</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <form onSubmit={createCategory} className="xf6s1t ai2y7z">
          <h3 style={{ fontSize: '15px', fontWeight: 600 }}>Create Category</h3>
          <input className="dl8e3f" value={catForm.name} onChange={e => setCatForm({ ...catForm, name: e.target.value })} placeholder="Category name" required />
          <input className="dl8e3f" value={catForm.description} onChange={e => setCatForm({ ...catForm, description: e.target.value })} placeholder="Description" />
          <button type="submit" className="qy2e7f rz4g9h vd2o7p">Create Category</button>
        </form>

        <form onSubmit={createForum} className="xf6s1t ai2y7z">
          <h3 style={{ fontSize: '15px', fontWeight: 600 }}>Create Forum</h3>
          <select className="dl8e3f" value={forumForm.categoryId} onChange={e => setForumForm({ ...forumForm, categoryId: e.target.value })} required>
            <option value="">Select category</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input className="dl8e3f" value={forumForm.name} onChange={e => setForumForm({ ...forumForm, name: e.target.value })} placeholder="Forum name" required />
          <input className="dl8e3f" value={forumForm.description} onChange={e => setForumForm({ ...forumForm, description: e.target.value })} placeholder="Description" />
          <input className="dl8e3f" value={forumForm.icon} onChange={e => setForumForm({ ...forumForm, icon: e.target.value })} placeholder="Icon (emoji)" />
          <button type="submit" className="qy2e7f rz4g9h vd2o7p">Create Forum</button>
        </form>
      </div>

      <div className="xf6s1t">
        <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>Current Structure</h3>
        {categories.map(cat => (
          <div key={cat.id} style={{ marginBottom: '16px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--c-accent)' }}>{cat.name}</h4>
            {cat.forums?.map(forum => (
              <div key={forum.id} style={{ padding: '8px 0 8px 16px', fontSize: '14px', borderLeft: '2px solid var(--c-border)' }}>
                {forum.icon} {forum.name} <span style={{ color: 'var(--c-text-muted)' }}>({forum.threadCount} threads)</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
