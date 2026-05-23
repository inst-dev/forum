'use client';

export default function Error({ error, reset }) {
  return (
    <div className="ie1n6o">
      <h1>500</h1>
      <h2>Something went wrong</h2>
      <p>An unexpected error occurred. Please try again later.</p>
      <button onClick={reset} className="qy2e7f rz4g9h">Try Again</button>
    </div>
  );
}
