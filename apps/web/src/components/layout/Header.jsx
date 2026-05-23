'use client';

import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import { useTheme } from '@/components/providers/ThemeProvider';
import { useSiteSettings } from '@/components/providers/SiteSettingsProvider';
import { useState } from 'react';
import { FiSun, FiMoon, FiMenu, FiBell, FiMessageSquare, FiSettings, FiLogOut, FiUser, FiBookmark, FiShield } from 'react-icons/fi';
import { clientApi } from '@/lib/api';

export function Header() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { siteName, siteLogo } = useSiteSettings();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleThemeToggle = async () => {
    toggleTheme();
    if (user) {
      await clientApi.put('/users/theme', { theme: theme === 'dark' ? 'light' : 'dark' });
    }
  };

  return (
    <header className="hd9x4k">
      <div className="xk2m9f jf2m7l">
        <div className="mv8t2u">
          <Link href="/" className="kw5p9n" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {siteLogo && <img src={siteLogo} alt={siteName} style={{ height: '28px', width: 'auto', borderRadius: '4px' }} />}
            <span>{siteName}</span>
          </Link>
        </div>

        <nav className="nw4y1z">
          <Link href="/" className="ox7a3b">Home</Link>
          <Link href="/forums" className="ox7a3b">Forums</Link>
          <Link href="/threads" className="ox7a3b">Latest</Link>
          <Link href="/members" className="ox7a3b">Members</Link>
          <Link href="/search" className="ox7a3b">Search</Link>
        </nav>

        <div className="lq3r6s">
          <button onClick={handleThemeToggle} className="tb8k3l qy2e7f vd2o7p" aria-label="Toggle theme">
            {theme === 'dark' ? <FiSun size={18} /> : <FiMoon size={18} />}
          </button>

          {user ? (
            <>
              <Link href="/notifications" className="tb8k3l qy2e7f vd2o7p" aria-label="Notifications"><FiBell size={18} /></Link>
              <Link href="/messages" className="tb8k3l qy2e7f vd2o7p" aria-label="Messages"><FiMessageSquare size={18} /></Link>
              <div className="xf8s3t">
                <button onClick={() => setMenuOpen(!menuOpen)} className="mv8t2u" style={{ cursor: 'pointer' }}>
                  <img src={user.avatar || '/default-avatar.svg'} alt={user.username} className="go4k9l hp6m1n" style={{ borderRadius: '50%' }} />
                </button>
                {menuOpen && (
                  <div className="yg0u5v">
                    <div className="zh2w7x">
                      <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--c-border)', marginBottom: '4px' }}>
                        <div style={{ fontWeight: 600, fontSize: '14px' }}>{user.displayName || user.username}</div>
                        <div style={{ fontSize: '12px', color: 'var(--c-text-muted)' }}>@{user.username}</div>
                      </div>
                      <Link href={`/users/${user.username}`} className="ai4y9z" onClick={() => setMenuOpen(false)}><FiUser size={14} /> Profile</Link>
                      <Link href="/settings" className="ai4y9z" onClick={() => setMenuOpen(false)}><FiSettings size={14} /> Settings</Link>
                      <Link href="/bookmarks" className="ai4y9z" onClick={() => setMenuOpen(false)}><FiBookmark size={14} /> Bookmarks</Link>
                      {user.role === 'ADMIN' && (
                        <Link href="/admin" className="ai4y9z" onClick={() => setMenuOpen(false)}><FiShield size={14} /> Admin Panel</Link>
                      )}
                      <button onClick={() => { logout(); setMenuOpen(false); }} className="ai4y9z" style={{ color: 'var(--c-error)' }}><FiLogOut size={14} /> Sign Out</button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="mv8t2u">
              <Link href="/login" className="qy2e7f sa6i1j vd2o7p">Log In</Link>
              <Link href="/register" className="qy2e7f rz4g9h vd2o7p">Sign Up</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
