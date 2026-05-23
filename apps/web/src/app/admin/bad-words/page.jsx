'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { clientApi } from '@/lib/api';

export default function BadWordsPage() {
  const { user } = useAuth();
  const [words, setWords] = useState([]);
  const [form, setForm] = useState({ word: '', replacement: '', language: 'en', severity: 1, isRegex: false });

  useEffect(() => { loadWords(); }, []);

  const loadWords = async () => {
    const res = await clientApi.get('/admin/bad-words');
    if (res.success) setWords(res.data);
  };

  const addWord = async (e) => {
    e.preventDefault();
    await clientApi.post('/admin/bad-words', form);
    setForm({ word: '', replacement: '', language: 'en', severity: 1, isRegex: false });
    loadWords();
  };

  const deleteWord = async (id) => {
    await clientApi.delete(`/admin/bad-words/${id}`);
    loadWords();
  };

  if (!user || user.role !== 'ADMIN') return <div className="uc4m9n"><p>Access denied.</p></div>;

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '20px' }}>Bad Word Filter</h1>
      
      <form onSubmit={addWord} className="xf6s1t ai2y7z" style={{ marginBottom: '16px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 600 }}>Add New Word</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px 80px', gap: '8px' }}>
          <input className="dl8e3f" value={form.word} onChange={e => setForm({ ...form, word: e.target.value })} placeholder="Bad word/regex" required />
          <input className="dl8e3f" value={form.replacement} onChange={e => setForm({ ...form, replacement: e.target.value })} placeholder="Replacement (optional)" />
          <select className="dl8e3f" value={form.language} onChange={e => setForm({ ...form, language: e.target.value })}>
            <option value="en">EN</option>
            <option value="si">SI</option>
            <option value="ta">TA</option>
          </select>
          <input type="number" className="dl8e3f" value={form.severity} onChange={e => setForm({ ...form, severity: parseInt(e.target.value) })} min={1} max={10} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <input type="checkbox" checked={form.isRegex} onChange={e => setForm({ ...form, isRegex: e.target.checked })} /> Regex
          </label>
          <button type="submit" className="qy2e7f rz4g9h vd2o7p">Add Word</button>
        </div>
      </form>

      <div className="xf6s1t" style={{ padding: 0 }}>
        {words.map(word => (
          <div key={word.id} className="zh0w5x" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <code style={{ background: 'var(--c-bg-tertiary)', padding: '2px 6px', borderRadius: '4px' }}>{word.word}</code>
              {word.replacement && <span style={{ fontSize: '13px', color: 'var(--c-text-muted)' }}>→ {word.replacement}</span>}
              <span className="px2c7d qy4e9f">{word.language}</span>
              {word.isRegex && <span className="px2c7d sa8i3j">regex</span>}
              <span style={{ fontSize: '12px', color: 'var(--c-text-muted)' }}>Severity: {word.severity}</span>
            </div>
            <button onClick={() => deleteWord(word.id)} className="qy2e7f uc0m5n vd2o7p">Delete</button>
          </div>
        ))}
        {words.length === 0 && <div className="uc4m9n"><p style={{ color: 'var(--c-text-muted)' }}>No bad words configured.</p></div>}
      </div>
    </div>
  );
}
