'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useParams } from 'next/navigation';
import { clientApi } from '@/lib/api';
import { toast } from 'sonner';
import { FiSend, FiArrowLeft } from 'react-icons/fi';
import Link from 'next/link';

export default function DirectMessagePage() {
  const { user } = useAuth();
  const params = useParams();
  const targetUsername = params.username;

  const [recipient, setRecipient] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const pollRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (!user || !targetUsername) return;
    loadRecipientAndMessages();

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [user, targetUsername]);

  // Poll for new messages every 3 seconds
  useEffect(() => {
    if (!conversationId) return;
    pollRef.current = setInterval(async () => {
      const msgRes = await clientApi.get(`/messages/conversations/${conversationId}`);
      if (msgRes.success && msgRes.data.length !== messages.length) {
        setMessages(msgRes.data);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    }, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [conversationId, messages.length]);

  const loadRecipientAndMessages = async () => {
    const profileRes = await clientApi.get(`/users/${targetUsername}`);
    if (!profileRes.success) {
      toast.error('User not found');
      setLoading(false);
      return;
    }
    setRecipient(profileRes.data);

    const convRes = await clientApi.get('/messages/conversations');
    if (convRes.success) {
      const existing = convRes.data.find(c => c.otherUser?.username === targetUsername || c.otherUser?.id === profileRes.data.id);
      if (existing) {
        setConversationId(existing.id);
        const msgRes = await clientApi.get(`/messages/conversations/${existing.id}`);
        if (msgRes.success) setMessages(msgRes.data);
      }
    }
    setLoading(false);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMsg.trim() || sending || !recipient) return;

    setSending(true);
    const res = await clientApi.post('/messages', { recipientId: recipient.id, content: newMsg });
    if (res.success) {
      setMessages(prev => [...prev, res.data]);
      setNewMsg('');
      if (!conversationId) {
        // Reload to get conversation ID
        const convRes = await clientApi.get('/messages/conversations');
        if (convRes.success) {
          const existing = convRes.data.find(c => c.otherUser?.id === recipient.id);
          if (existing) setConversationId(existing.id);
        }
      }
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } else {
      toast.error(res.error?.message || 'Failed to send');
    }
    setSending(false);
  };

  // Simulate typing indicator (visual only for now)
  const handleInputChange = (e) => {
    setNewMsg(e.target.value);
    // Could emit typing event via WebSocket here
  };

  if (!user) return <div className="uc4m9n"><p>Please log in to send messages.</p></div>;
  if (loading) return <div className="uc4m9n"><div className="tb2k7l" /></div>;
  if (!recipient) return <div className="uc4m9n"><p>User not found.</p></div>;

  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <Link href="/messages" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: 'var(--c-text-muted)' }}>
          <FiArrowLeft size={14} /> Back to messages
        </Link>
      </div>

      <div className="xf6s1t" style={{ padding: 0, overflow: 'hidden', height: 'calc(100vh - 220px)', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--c-border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src={recipient.avatar || '/default-avatar.svg'} alt="" className="go4k9l hp6m1n" style={{ borderRadius: '50%' }} />
          <div>
            <Link href={`/users/${recipient.username}`} style={{ fontWeight: 600, fontSize: '14px' }}>{recipient.displayName || recipient.username}</Link>
            <div style={{ fontSize: '12px', color: 'var(--c-text-muted)' }}>@{recipient.username}</div>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {messages.length === 0 && (
            <div className="uc4m9n" style={{ flex: 1 }}>
              <p style={{ color: 'var(--c-text-muted)', fontSize: '14px' }}>Send a message to start the conversation with @{recipient.username}</p>
            </div>
          )}
          {messages.map(msg => (
            <div key={msg.id} style={{ marginBottom: '12px', display: 'flex', justifyContent: msg.sender?.id === user.id ? 'flex-end' : 'flex-start' }}>
              <div style={{ maxWidth: '70%', padding: '10px 14px', borderRadius: '16px', background: msg.sender?.id === user.id ? 'var(--c-accent)' : 'var(--c-bg-tertiary)', color: msg.sender?.id === user.id ? '#fff' : 'var(--c-text-primary)', fontSize: '14px' }}>
                {msg.content}
                <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '4px' }}>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={sendMessage} className="hd9l4m">
          <input type="text" className="dl8e3f" style={{ flex: 1 }} value={newMsg} onChange={handleInputChange} placeholder={`Message @${recipient.username}...`} autoFocus />
          <button type="submit" className="qy2e7f rz4g9h" disabled={sending || !newMsg.trim()}>
            <FiSend size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
