'use client';

import { useState, useEffect } from 'react';
import { clientApi } from '@/lib/api';

export function ForumSelector({ value, onChange }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await clientApi.get('/forums/categories');
      if (res.success && res.data) {
        setCategories(res.data);
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return <select className="dl8e3f" disabled><option>Loading forums...</option></select>;
  }

  return (
    <select className="dl8e3f" value={value} onChange={e => onChange(e.target.value)} required>
      <option value="">Select a forum</option>
      {categories.map(cat => (
        <optgroup key={cat.id} label={cat.name}>
          {cat.forums?.map(forum => (
            <option key={forum.id} value={forum.id}>
              {forum.icon} {forum.name}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
