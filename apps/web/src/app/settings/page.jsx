'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import { clientApi } from '@/lib/api';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { user } = useAuth();
  const [form, setForm] = useState({ displayName: '', bio: '', signature: '', statusMessage: '', location: '', website: '', twitter: '', github: '', discord: '', youtube: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        displayName: user.displayName || '',
        bio: user.bio || '',
        signature: user.signature || '',
        statusMessage: user.statusMessage || '',
        location: user.location || '',
        website: user.website || '',
        twitter: user.twitter || '',
        github: user.github || '',
        discord: user.discord || '',
        youtube: user.youtube || '',
      });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await clientApi.put('/users/profile', form);
    setLoading(false);
    if (res.success) toast.success('Profile updated successfully');
    else toast.error('Failed to update profile');
  };

  if (!user) return <div className="uc4m9n"><p>Please log in to access settings.</p></div>;

  return (
    <div className="tp1j6k">
      <nav className="uq3l8m">
        <Link href="/settings" className="vr5n0o">Profile</Link>
        <Link href="/settings/privacy">Privacy</Link>
        <Link href="/settings/notifications">Notifications</Link>
        <Link href="/settings/appearance">Appearance</Link>
        <Link href="/settings/security">Security</Link>
        <Link href="/settings/sessions">Sessions</Link>
        <Link href="/settings/username">Username</Link>
      </nav>

      <div className="ws7p2q">
        <h1 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '20px' }}>Edit Profile</h1>

        {/* Avatar & Cover Upload */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          <ImageUpload
            currentImage={user.avatar}
            onUpload={(url) => toast.success('Avatar updated')}
            type="avatar"
            label="Profile Picture"
          />
          <ImageUpload
            currentImage={user.banner}
            onUpload={(url) => toast.success('Cover image updated')}
            type="banner"
            label="Cover Image"
          />
        </div>

        <form onSubmit={handleSubmit} className="ai2y7z">
          <div className="bj4a9b">
            <label className="ck6c1d">Display Name</label>
            <input className="dl8e3f" value={form.displayName} onChange={e => setForm({ ...form, displayName: e.target.value })} />
          </div>
          <div className="bj4a9b">
            <label className="ck6c1d">Bio</label>
            <textarea className="dl8e3f em0g5h" value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} placeholder="Tell us about yourself..." maxLength={1000} />
          </div>
          <div className="bj4a9b">
            <label className="ck6c1d">Signature</label>
            <input className="dl8e3f" value={form.signature} onChange={e => setForm({ ...form, signature: e.target.value })} maxLength={500} />
          </div>
          <div className="bj4a9b">
            <label className="ck6c1d">Status Message</label>
            <input className="dl8e3f" value={form.statusMessage} onChange={e => setForm({ ...form, statusMessage: e.target.value })} maxLength={100} />
          </div>
          <div className="bj4a9b">
            <label className="ck6c1d">Location</label>
            <input className="dl8e3f" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
          </div>
          <hr style={{ border: 'none', borderTop: '1px solid var(--c-border)' }} />
          <h3 style={{ fontSize: '15px', fontWeight: 600 }}>Social Links</h3>
          <div className="bj4a9b">
            <label className="ck6c1d">Website</label>
            <input className="dl8e3f" value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} type="url" placeholder="https://" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="bj4a9b"><label className="ck6c1d">Twitter</label><input className="dl8e3f" value={form.twitter} onChange={e => setForm({ ...form, twitter: e.target.value })} placeholder="username" /></div>
            <div className="bj4a9b"><label className="ck6c1d">GitHub</label><input className="dl8e3f" value={form.github} onChange={e => setForm({ ...form, github: e.target.value })} placeholder="username" /></div>
            <div className="bj4a9b"><label className="ck6c1d">Discord</label><input className="dl8e3f" value={form.discord} onChange={e => setForm({ ...form, discord: e.target.value })} placeholder="username#0000" /></div>
            <div className="bj4a9b"><label className="ck6c1d">YouTube</label><input className="dl8e3f" value={form.youtube} onChange={e => setForm({ ...form, youtube: e.target.value })} placeholder="channel URL" /></div>
          </div>
          <button type="submit" className="qy2e7f rz4g9h" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</button>
        </form>
      </div>
    </div>
  );
}
