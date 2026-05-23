import Link from 'next/link';

export function Footer() {
  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'NullForum';

  return (
    <footer style={{ borderTop: '1px solid var(--c-border)', padding: '24px 0', marginTop: '40px' }}>
      <div className="xk2m9f" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ fontSize: '13px', color: 'var(--c-text-muted)' }}>
          &copy; {new Date().getFullYear()} {appName}. All rights reserved.
        </div>
        <nav style={{ display: 'flex', gap: '16px', fontSize: '13px' }}>
          <Link href="/rules" style={{ color: 'var(--c-text-muted)' }}>Rules</Link>
          <Link href="/privacy" style={{ color: 'var(--c-text-muted)' }}>Privacy</Link>
          <Link href="/terms" style={{ color: 'var(--c-text-muted)' }}>Terms</Link>
          <Link href="/contact" style={{ color: 'var(--c-text-muted)' }}>Contact</Link>
        </nav>
      </div>
    </footer>
  );
}
