'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { clientApi } from '@/lib/api';

const SiteSettingsContext = createContext({
  settings: {},
  loading: true,
});

export function SiteSettingsProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await clientApi.get('/site-settings');
        if (res.success && res.data) {
          setSettings(res.data);
        }
      } catch {
        // Settings fetch failed, continue with defaults
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  // Show maintenance page for non-admin users
  if (!loading && !authLoading && settings.maintenance_mode === 'true') {
    const isAdmin = user?.role === 'ADMIN';
    if (!isAdmin) {
      return (
        <SiteSettingsContext.Provider value={{ settings, loading }}>
          <div className="uc4m9n" style={{ minHeight: '100vh', flexDirection: 'column', gap: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px' }}>🔧</div>
            <h1 style={{ fontSize: '28px', fontWeight: 700 }}>Under Maintenance</h1>
            <p style={{ fontSize: '16px', color: 'var(--c-text-muted)', maxWidth: '400px' }}>
              We&apos;re currently performing scheduled maintenance. Please check back soon.
            </p>
            <p style={{ fontSize: '13px', color: 'var(--c-text-muted)', marginTop: '12px' }}>
              If you&apos;re an administrator, please log in to access the site.
            </p>
          </div>
        </SiteSettingsContext.Provider>
      );
    }
  }

  return (
    <SiteSettingsContext.Provider value={{ settings, loading }}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}
