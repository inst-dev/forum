'use client';

import { useState, useEffect } from 'react';

function getTimeAgo(date) {
  const now = new Date();
  const d = new Date(date);
  const diff = Math.floor((now - d) / 1000);

  if (diff < 5) return 'just now';
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  if (diff < 2592000) return `${Math.floor(diff / 604800)}w ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function TimeAgo({ date, className = '' }) {
  const [text, setText] = useState('');

  useEffect(() => {
    setText(getTimeAgo(date));
    const interval = setInterval(() => setText(getTimeAgo(date)), 30000);
    return () => clearInterval(interval);
  }, [date]);

  if (!date) return null;

  return <time className={className} dateTime={new Date(date).toISOString()} title={new Date(date).toLocaleString()}>{text}</time>;
}
