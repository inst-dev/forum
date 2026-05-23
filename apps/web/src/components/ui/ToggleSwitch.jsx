'use client';

export function ToggleSwitch({ checked, onChange, label, disabled = false }) {
  return (
    <label className="n8k2v1">
      {label && <span className="n8k2v2">{label}</span>}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        className={`n8k2v3 ${checked ? 'n8k2v4' : ''}`}
        onClick={() => onChange(!checked)}
      >
        <span className={`n8k2v5 ${checked ? 'n8k2v6' : ''}`} />
      </button>
    </label>
  );
}
