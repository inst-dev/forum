'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { clientApi } from '@/lib/api';

const SiteSettingsContext = createContext({
  siteName: 'NullForum',
  siteDescription: '',
  siteLogo: '',
  siteFavicon: '',
  primaryColor: '#1a73e8',
  maintenanceMode: false,
  loading: true,
});

export function SiteSettingsProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const [settings, setSettings] = useState({
    siteName: process.env.NEXT_PUBLIC_APP_NAME || 'NullForum',
    siteDescription: '',
    siteLogo: '',
    siteFavicon: '',
    primaryColor: '#1a73e8',
    maintenanceMode: false,
    loading: true,
  });

  useEffect(() => {
    async function load() {
      try {
        const res = await clientApi.get('/site-settings');
        if (res.success && res.data) {
          setSettings(prev => ({
            ...prev,
            siteName: res.data.site_name || prev.siteName,
            siteDescription: res.data.site_description || prev.siteDescription,
            siteLogo: res.data.site_logo || '',
            siteFavicon: res.data.site_favicon || '',
            primaryColor: res.data.primary_color || '#1a73e8',
            maintenanceMode: res.data.maintenance_mode === 'true',
            loading: false,
          }));
          if (res.data.primary_color) {
            document.documentElement.style.setProperty('--c-accent', res.data.primary_color);
          }
          // Set dynamic favicon
          if (res.data.site_favicon) {
            let link = document.querySelector("link[rel~='icon']");
            if (!link) {
              link = document.createElement('link');
              link.rel = 'icon';
              document.head.appendChild(link);
            }
            link.href = res.data.site_favicon;
          }
          // Set dynamic page title prefix
          if (res.data.site_name) {
            document.title = document.title.replace(/\| .*$/, `| ${res.data.site_name}`);
          }
        } else {
          setSettings(prev => ({ ...prev, loading: false }));
        }
      } catch {
        setSettings(prev => ({ ...prev, loading: false }));
      }
    }
    load();
  }, []);

  // Block non-admin users during maintenance mode
  if (!settings.loading && !authLoading && settings.maintenanceMode) {
    const isAdmin = user?.role === 'ADMIN';
    if (!isAdmin) {
      return (
        <SiteSettingsContext.Provider value={settings}>
          <div className="uc4m9n" style={{ minHeight: '100vh', flexDirection: 'column', gap: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px' }}>🔧</div>
            <h1 style={{ fontSize: '28px', fontWeight: 700 }}>Under Maintenance</h1>
            <p style={{ fontSize: '16px', color: 'var(--c-text-muted)', maxWidth: '400px' }}>
              We are currently performing scheduled maintenance. Please check back soon.
            </p>
          </div>
        </SiteSettingsContext.Provider>
      );
    }
  }

  return (
    <SiteSettingsContext.Provider value={settings}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}
