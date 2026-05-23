export const metadata = { title: 'Privacy Policy' };

export default function PrivacyPage() {
  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'NullForum';
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '24px' }}>Privacy Policy</h1>
      <div className="xf6s1t ok1z6a">
        <p><em>Last updated: {new Date().toLocaleDateString()}</em></p>
        <h2>Information We Collect</h2>
        <p>{appName} collects information you provide directly: email address, username, profile information, and content you post. We also collect usage data including IP addresses, device information, and browsing behavior.</p>
        <h2>How We Use Information</h2>
        <p>We use your information to provide and improve our services, communicate with you, ensure security, and comply with legal obligations.</p>
        <h2>Data Sharing</h2>
        <p>We do not sell your personal information. We may share data with service providers who assist in operating our platform, or when required by law.</p>
        <h2>Your Rights</h2>
        <p>You can access, update, or delete your personal information through your account settings. You can also request data export or account deletion by contacting support.</p>
        <h2>Cookies</h2>
        <p>We use essential cookies for authentication and preferences. No third-party tracking cookies are used.</p>
        <h2>Security</h2>
        <p>We implement industry-standard security measures including encryption, secure sessions, and regular security audits.</p>
        <h2>Contact</h2>
        <p>For privacy-related inquiries, contact us at privacy@nullforum.com.</p>
      </div>
    </div>
  );
}
