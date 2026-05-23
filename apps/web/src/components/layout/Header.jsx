'use client';

import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import { useTheme } from '@/components/providers/ThemeProvider';
import { useState } from 'react';

export function Header() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);

  return (
    <header className="hd9x4k">
      <div className="xk2m9f jf2m7l">
        <div className="mv8t2u">
          <button className="tb8k3l qy2e7f vd2o7p" onClick={() => setMobileNav(!mobileNav)} style={{ display: 'none' }} aria-label="Menu">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          <Link href="/" className="kw5p9n">{process.env.NEXT_PUBLIC_APP_NAME || 'NullForum'}</Link>
        </div>

        <nav className="nw4y1z">
          <Link href="/" className="ox7a3b">Home</Link>
          <Link href="/forums" className="ox7a3b">Forums</Link>
          <Link href="/threads" className="ox7a3b">Latest</Link>
          <Link href="/members" className="ox7a3b">Members</Link>
          <Link href="/search" className="ox7a3b">Search</Link>
        </nav>

        <div className="lq3r6s">
          <button onClick={toggleTheme} className="tb8k3l qy2e7f vd2o7p" aria-label="Toggle theme">
            {theme === 'dark' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
            )}
          </button>

          {user ? (
            <div className="xf8s3t">
              <button onClick={() => setMenuOpen(!menuOpen)} className="mv8t2u" style={{ cursor: 'pointer' }}>
                <img src={user.avatar || '/default-avatar.svg'} alt={user.username} className="go4k9l hp6m1n" />
              </button>
              {menuOpen && (
                <div className="yg0u5v">
                  <div className="zh2w7x">
                    <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--c-border)', marginBottom: '4px' }}>
                      <div style={{ fontWeight: 600, fontSize: '14px' }}>{user.displayName || user.username}</div>
                      <div style={{ fontSize: '12px', color: 'var(--c-text-muted)' }}>@{user.username}</div>
                    </div>
                    <Link href={`/users/${user.username}`} className="ai4y9z" onClick={() => setMenuOpen(false)}>Profile</Link>
                    <Link href="/settings" className="ai4y9z" onClick={() => setMenuOpen(false)}>Settings</Link>
                    <Link href="/bookmarks" className="ai4y9z" onClick={() => setMenuOpen(false)}>Bookmarks</Link>
                    <Link href="/messages" className="ai4y9z" onClick={() => setMenuOpen(false)}>Messages</Link>
                    <Link href="/notifications" className="ai4y9z" onClick={() => setMenuOpen(false)}>Notifications</Link>
                    {user.role === 'ADMIN' && (
                      <Link href="/admin" className="ai4y9z" onClick={() => setMenuOpen(false)}>Admin Panel</Link>
                    )}
                    <button onClick={() => { logout(); setMenuOpen(false); }} className="ai4y9z" style={{ color: 'var(--c-error)' }}>Sign Out</button>
                  </div>
                </div>
              )}
            </div>
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
