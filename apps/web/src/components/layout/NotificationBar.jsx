'use client';

import { useState, useEffect } from 'react';
import { clientApi } from '@/lib/api';

export function NotificationBarWrapper() {
  const [bars, setBars] = useState([]);
  const [dismissed, setDismissed] = useState(new Set());

  useEffect(() => {
    async function fetchBars() {
      const res = await clientApi.get('/admin/notification-bars/active');
      if (res.success && res.data) {
        setBars(res.data);
      }
    }
    fetchBars();
  }, []);

  if (bars.length === 0) return null;

  return (
    <div>
      {bars.filter(bar => !dismissed.has(bar.id)).map(bar => (
        <div key={bar.id} className="vd6o1p" style={{ background: bar.backgroundColor, color: bar.textColor }}>
          <span>{bar.text}</span>
          {bar.buttonText && bar.buttonUrl && (
            <a href={bar.buttonUrl} className="we8q3r" style={{ background: bar.buttonColor || 'rgba(255,255,255,0.2)', color: bar.textColor }}>{bar.buttonText}</a>
          )}
          {bar.isClosable && (
            <button onClick={() => setDismissed(prev => new Set([...prev, bar.id]))} style={{ marginLeft: '12px', color: bar.textColor, opacity: 0.7 }} aria-label="Close">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
