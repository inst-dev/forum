'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { FiHome, FiUsers, FiFlag, FiMessageSquare, FiSettings, FiActivity, FiShield, FiAlertCircle, FiAward, FiBell, FiLayout } from 'react-icons/fi';

const adminNav = [
  { href: '/admin', label: 'Dashboard', icon: FiHome },
  { href: '/admin/users', label: 'Users', icon: FiUsers },
  { href: '/admin/reports', label: 'Reports', icon: FiFlag },
  { href: '/admin/forums', label: 'Forums', icon: FiMessageSquare },
  { href: '/admin/badges', label: 'Badges', icon: FiAward },
  { href: '/admin/notifications', label: 'Notification Bars', icon: FiBell },
  { href: '/admin/moderation', label: 'Moderation Logs', icon: FiShield },
  { href: '/admin/bad-words', label: 'Bad Words', icon: FiAlertCircle },
  { href: '/admin/analytics', label: 'Analytics', icon: FiActivity },
  { href: '/admin/username-requests', label: 'Username Requests', icon: FiUsers },
  { href: '/admin/settings', label: 'Settings', icon: FiSettings },
];

export default function AdminLayout({ children }) {
  const { user } = useAuth();
  const pathname = usePathname();

  if (!user || user.role !== 'ADMIN') {
    return <div className="uc4m9n"><p style={{ color: 'var(--c-error)' }}>Access denied. Admin only.</p></div>;
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '24px', minHeight: 'calc(100vh - 160px)' }}>
      {/* Sidebar */}
      <aside style={{ position: 'sticky', top: 'calc(var(--c-header-height) + 24px)', height: 'fit-content' }}>
        <div className="xf6s1t" style={{ padding: '12px' }}>
          <div style={{ padding: '8px 12px', marginBottom: '8px', fontSize: '12px', fontWeight: 700, color: 'var(--c-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            <FiLayout size={12} style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Admin Panel
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {adminNav.map(item => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    borderRadius: 'var(--c-radius-sm)',
                    fontSize: '14px',
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? 'var(--c-accent)' : 'var(--c-text-secondary)',
                    background: isActive ? 'var(--c-accent-light)' : 'transparent',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ minWidth: 0 }}>
        {children}
      </main>
    </div>
  );
}
