'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { clientApi } from '@/lib/api';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';
import { ColorPicker } from '@/components/ui/ColorPicker';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { toast } from 'sonner';

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    site_name: 'NullForum',
    site_description: '',
    site_logo: '',
    site_favicon: '',
    primary_color: '#1a73e8',
    registration_enabled: 'true',
    require_email_verification: 'true',
    max_upload_size: '10',
    captcha_enabled: 'false',
    maintenance_mode: 'false',
    badword_filter_enabled: 'true',
  });

  useEffect(() => {
    async function load() {
      const res = await clientApi.get('/admin/settings');
      if (res.success) setSettings(prev => ({ ...prev, ...res.data }));
    }
    if (user?.role === 'ADMIN') load();
  }, [user]);

  const handleSave = async () => {
    const res = await clientApi.put('/admin/settings', settings);
    if (res.success) toast.success('Settings saved successfully');
    else toast.error('Failed to save settings');
  };

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: String(value) }));
  };

  const updateSettingAndSave = async (key, value) => {
    const updated = { ...settings, [key]: String(value) };
    setSettings(updated);
    const res = await clientApi.put('/admin/settings', { [key]: String(value) });
    if (res.success) toast.success(`${key.replace('site_', '').replace('_', ' ')} updated`);
    else toast.error('Failed to save');
  };

  if (!user || user.role !== 'ADMIN') return <div className="uc4m9n"><p>Access denied.</p></div>;

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '20px' }}>Site Settings</h1>

      <div className="pm5k8w">
        {/* General */}
        <div className="xf6s1t">
          <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>General</h3>
          <div className="ai2y7z">
            <div className="bj4a9b">
              <label className="ck6c1d">Site Name</label>
              <input className="dl8e3f" value={settings.site_name} onChange={e => updateSetting('site_name', e.target.value)} />
            </div>
            <div className="bj4a9b">
              <label className="ck6c1d">Site Description</label>
              <input className="dl8e3f" value={settings.site_description} onChange={e => updateSetting('site_description', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Branding */}
        <div className="xf6s1t">
          <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>Branding</h3>
          <div className="ai2y7z">
            <div className="bj4a9b">
              <label className="ck6c1d">Site Logo</label>
              {settings.site_logo && (
                <div style={{ marginBottom: '8px', padding: '12px', background: 'var(--c-bg-secondary)', borderRadius: 'var(--c-radius-md)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img src={settings.site_logo} alt="Current logo" style={{ height: '40px', width: 'auto', borderRadius: '4px' }} />
                  <span style={{ fontSize: '13px', color: 'var(--c-text-muted)' }}>Current logo</span>
                </div>
              )}
              <ImageUpload
                currentImage={settings.site_logo}
                onUpload={(url) => updateSettingAndSave('site_logo', url)}
                type="attachment"
                label="Upload new logo"
              />
            </div>
            <div className="bj4a9b">
              <label className="ck6c1d">Favicon</label>
              {settings.site_favicon && (
                <div style={{ marginBottom: '8px', padding: '12px', background: 'var(--c-bg-secondary)', borderRadius: 'var(--c-radius-md)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img src={settings.site_favicon} alt="Current favicon" style={{ height: '32px', width: '32px', borderRadius: '4px', objectFit: 'contain' }} />
                  <span style={{ fontSize: '13px', color: 'var(--c-text-muted)' }}>Current favicon</span>
                </div>
              )}
              <ImageUpload
                currentImage={settings.site_favicon}
                onUpload={(url) => updateSettingAndSave('site_favicon', url)}
                type="attachment"
                label="Upload new favicon"
              />
            </div>
            <ColorPicker
              value={settings.primary_color}
              onChange={(color) => updateSetting('primary_color', color)}
              label="Primary Color"
            />
          </div>
        </div>

        {/* Features */}
        <div className="xf6s1t">
          <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>Features</h3>
          <div className="ai2y7z">
            <ToggleSwitch
              label="Registration Enabled"
              checked={settings.registration_enabled === 'true'}
              onChange={(v) => updateSetting('registration_enabled', v)}
            />
            <ToggleSwitch
              label="Require Email Verification"
              checked={settings.require_email_verification === 'true'}
              onChange={(v) => updateSetting('require_email_verification', v)}
            />
            <ToggleSwitch
              label="CAPTCHA Enabled"
              checked={settings.captcha_enabled === 'true'}
              onChange={(v) => updateSetting('captcha_enabled', v)}
            />
            <ToggleSwitch
              label="Bad Word Filter"
              checked={settings.badword_filter_enabled === 'true'}
              onChange={(v) => updateSetting('badword_filter_enabled', v)}
            />
            <div className="bj4a9b">
              <label className="ck6c1d">Max Upload Size (MB)</label>
              <input className="dl8e3f" type="number" value={settings.max_upload_size} onChange={e => updateSetting('max_upload_size', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Maintenance */}
        <div className="xf6s1t" style={{ border: settings.maintenance_mode === 'true' ? '2px solid var(--c-error)' : undefined }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', color: settings.maintenance_mode === 'true' ? 'var(--c-error)' : undefined }}>Maintenance Mode</h3>
          <p style={{ fontSize: '13px', color: 'var(--c-text-muted)', marginBottom: '12px' }}>When enabled, the site will be inaccessible to all non-admin users.</p>
          <ToggleSwitch
            label="Enable Maintenance Mode"
            checked={settings.maintenance_mode === 'true'}
            onChange={(v) => updateSetting('maintenance_mode', v)}
          />
        </div>

        <button onClick={handleSave} className="qy2e7f rz4g9h">Save All Settings</button>
      </div>
    </div>
  );
}
