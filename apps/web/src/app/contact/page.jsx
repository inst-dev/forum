'use client';

import { useState } from 'react';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
  };

  if (sent) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', padding: '60px 20px' }}>
        <h1 style={{ fontSize: '24px', marginBottom: '12px' }}>Message Sent</h1>
        <p style={{ color: 'var(--c-text-muted)' }}>Thank you for reaching out. We will get back to you within 24-48 hours.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>Contact Us</h1>
      <p style={{ color: 'var(--c-text-muted)', marginBottom: '24px' }}>Have a question or feedback? Send us a message.</p>

      <form onSubmit={handleSubmit} className="xf6s1t ai2y7z">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="bj4a9b">
            <label className="ck6c1d">Name</label>
            <input className="dl8e3f" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="bj4a9b">
            <label className="ck6c1d">Email</label>
            <input type="email" className="dl8e3f" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          </div>
        </div>
        <div className="bj4a9b">
          <label className="ck6c1d">Subject</label>
          <input className="dl8e3f" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} required />
        </div>
        <div className="bj4a9b">
          <label className="ck6c1d">Message</label>
          <textarea className="dl8e3f em0g5h" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required rows={6} />
        </div>
        <button type="submit" className="qy2e7f rz4g9h">Send Message</button>
      </form>
    </div>
  );
}
