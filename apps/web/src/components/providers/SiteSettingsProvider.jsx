'use client';

import { createContext, useContext, useState, useEffect } from 'react';
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
        const res = await clientApi.get('/admin/notification-bars/active');
        // Also fetch site settings from a public endpoint
        const settingsRes = await fetch('/api/admin/settings/public');
        if (settingsRes.ok) {
          const data = await settingsRes.json();
          if (data.success && data.data) {
            setSettings(prev => ({
              ...prev,
              siteName: data.data.site_name || prev.siteName,
              siteDescription: data.data.site_description || prev.siteDescription,
              siteLogo: data.data.site_logo || '',
              siteFavicon: data.data.site_favicon || '',
              primaryColor: data.data.primary_color || '#1a73e8',
              maintenanceMode: data.data.maintenance_mode === 'true',
              loading: false,
            }));
            // Apply primary color as CSS variable
            if (data.data.primary_color) {
              document.documentElement.style.setProperty('--c-accent', data.data.primary_color);
            }
          } else {
            setSettings(prev => ({ ...prev, loading: false }));
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

  return (
    <SiteSettingsContext.Provider value={settings}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}
