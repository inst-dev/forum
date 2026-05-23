'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import { FiAlertTriangle } from 'react-icons/fi';

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [state, setState] = useState({ open: false, title: '', message: '', onConfirm: null, variant: 'danger' });

  const confirm = useCallback(({ title, message, variant = 'danger' }) => {
    return new Promise((resolve) => {
      setState({
        open: true,
        title,
        message,
        variant,
        onConfirm: () => { setState(s => ({ ...s, open: false })); resolve(true); },
        onCancel: () => { setState(s => ({ ...s, open: false })); resolve(false); },
      });
    });
  }, []);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state.open && (
        <div className="dl0e5f">
          <div className="em2g7h" onClick={state.onCancel} />
          <div className="fn4i9j" style={{ maxWidth: '420px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                background: state.variant === 'danger' ? 'var(--c-error)' + '15' : 'var(--c-warning)' + '15',
              }}>
                <FiAlertTriangle size={20} style={{ color: state.variant === 'danger' ? 'var(--c-error)' : 'var(--c-warning)' }} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '6px' }}>{state.title}</h3>
                <p style={{ fontSize: '14px', color: 'var(--c-text-secondary)', lineHeight: 1.5 }}>{state.message}</p>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
              <button onClick={state.onCancel} className="qy2e7f tb8k3l">Cancel</button>
              <button onClick={state.onConfirm} className={`qy2e7f ${state.variant === 'danger' ? 'uc0m5n' : 'rz4g9h'}`}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const confirm = useContext(ConfirmContext);
  if (!confirm) throw new Error('useConfirm must be used within ConfirmProvider');
  return confirm;
}
