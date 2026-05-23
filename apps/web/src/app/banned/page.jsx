export const metadata = { title: 'Account Banned' };

export default function BannedPage() {
  return (
    <div className="ie1n6o">
      <h1 style={{ color: 'var(--c-error)' }}>Banned</h1>
      <h2>Your account has been banned</h2>
      <p>Your account has been banned due to violations of our community guidelines. If you believe this is a mistake, please contact support.</p>
    </div>
  );
}
