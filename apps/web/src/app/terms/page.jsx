export const metadata = { title: 'Terms of Service' };

export default function TermsPage() {
  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'NullForum';
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '24px' }}>Terms of Service</h1>
      <div className="xf6s1t ok1z6a">
        <p><em>Last updated: {new Date().toLocaleDateString()}</em></p>
        <h2>Acceptance of Terms</h2>
        <p>By using {appName}, you agree to these terms. If you do not agree, do not use the platform.</p>
        <h2>Account Responsibilities</h2>
        <p>You are responsible for your account security and all activities under your account. You must provide accurate information during registration.</p>
        <h2>Content Guidelines</h2>
        <p>You retain ownership of content you post. By posting, you grant us a license to display and distribute your content on the platform. You must not post illegal, harmful, or infringing content.</p>
        <h2>Prohibited Activities</h2>
        <p>Spamming, harassment, impersonation, hacking attempts, scraping, and circumventing security measures are prohibited.</p>
        <h2>Moderation</h2>
        <p>We reserve the right to remove content or suspend accounts that violate these terms or community rules.</p>
        <h2>Limitation of Liability</h2>
        <p>{appName} is provided &ldquo;as is&rdquo; without warranties. We are not liable for damages arising from use of the platform.</p>
        <h2>Changes to Terms</h2>
        <p>We may update these terms. Continued use after changes constitutes acceptance.</p>
      </div>
    </div>
  );
}
