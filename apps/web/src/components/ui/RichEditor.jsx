'use client';

import { useState, useRef } from 'react';
import { FiBold, FiItalic, FiLink, FiImage, FiCode, FiList } from 'react-icons/fi';
import { BsQuote, BsTypeH2 } from 'react-icons/bs';

export function RichEditor({ value, onChange, placeholder = 'Write your content...' }) {
  const textareaRef = useRef(null);

  const insertMarkdown = (before, after = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.substring(start, end);
    const newText = value.substring(0, start) + before + selected + after + value.substring(end);
    onChange(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selected.length);
    }, 0);
  };

  const toolbar = [
    { icon: <FiBold size={15} />, action: () => insertMarkdown('**', '**'), title: 'Bold' },
    { icon: <FiItalic size={15} />, action: () => insertMarkdown('*', '*'), title: 'Italic' },
    { icon: <BsTypeH2 size={15} />, action: () => insertMarkdown('\n## ', '\n'), title: 'Heading' },
    { icon: <FiCode size={15} />, action: () => insertMarkdown('`', '`'), title: 'Code' },
    { icon: <BsQuote size={15} />, action: () => insertMarkdown('\n> ', '\n'), title: 'Quote' },
    { icon: <FiLink size={15} />, action: () => insertMarkdown('[', '](url)'), title: 'Link' },
    { icon: <FiImage size={15} />, action: () => insertMarkdown('![alt](', ')'), title: 'Image' },
    { icon: <FiList size={15} />, action: () => insertMarkdown('\n- ', '\n'), title: 'List' },
  ];

  return (
    <div style={{ border: '1px solid var(--c-border)', borderRadius: 'var(--c-radius-md)', overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '2px', padding: '8px', borderBottom: '1px solid var(--c-border-light)', background: 'var(--c-bg-secondary)', flexWrap: 'wrap' }}>
        {toolbar.map((btn, i) => (
          <button
            key={i}
            type="button"
            onClick={btn.action}
            title={btn.title}
            style={{
              padding: '6px 8px',
              borderRadius: '4px',
              color: 'var(--c-text-secondary)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {btn.icon}
          </button>
        ))}
      </div>
      {/* Editor area */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          minHeight: '300px',
          padding: '16px',
          border: 'none',
          outline: 'none',
          resize: 'vertical',
          fontFamily: 'var(--c-font-mono)',
          fontSize: '14px',
          lineHeight: 1.7,
          background: 'var(--c-bg-primary)',
          color: 'var(--c-text-primary)',
        }}
      />
      <div style={{ padding: '6px 12px', borderTop: '1px solid var(--c-border-light)', fontSize: '11px', color: 'var(--c-text-muted)', background: 'var(--c-bg-secondary)' }}>
        Markdown supported. Use **bold**, *italic*, `code`, [link](url)
      </div>
    </div>
  );
}
