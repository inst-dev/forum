'use client';

import { useState } from 'react';

export function ColorPicker({ value, onChange, label }) {
  const [color, setColor] = useState(value || '#1a73e8');

  const handleChange = (e) => {
    setColor(e.target.value);
    onChange?.(e.target.value);
  };

  return (
    <div className="n8k2v8">
      {label && <span className="n8k2v2">{label}</span>}
      <div className="n8k2vd">
        <input
          type="color"
          value={color}
          onChange={handleChange}
          className="n8k2ve"
        />
        <input
          type="text"
          value={color}
          onChange={handleChange}
          className="dl8e3f"
          pattern="^#[0-9a-fA-F]{6}$"
          style={{ flex: 1 }}
        />
      </div>
    </div>
  );
}
