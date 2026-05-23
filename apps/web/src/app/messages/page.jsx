'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { clientApi } from '@/lib/api';

export default function MessagesPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');

  useEffect(() => {
    async function load() {
      const res = await clientApi.get('/messages/conversations');
      if (res.success) setConversations(res.data);
    }
    if (user) load();
  }, [user]);

  const loadConversation = async (conv) => {
    setActive(conv);
    const res = await clientApi.get(`/messages/conversations/${conv.id}`);
    if (res.success) setMessages(res.data);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMsg.trim() || !active) return;
    const res = await clientApi.post('/messages', { recipientId: active.otherUser?.id, content: newMsg });
    if (res.success) {
      setMessages(prev => [...prev, res.data]);
      setNewMsg('');
    }
  };

  if (!user) return <div className="uc4m9n"><p>Please log in to view messages.</p></div>;

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '20px' }}>Messages</h1>
      <div className="dz1d6e">
        {/* Conversation List */}
        <div className="ea3f8g">
          {conversations.map(conv => (
            <div key={conv.id} onClick={() => loadConversation(conv)} className="zh0w5x" style={{ cursor: 'pointer', background: active?.id === conv.id ? 'var(--c-bg-hover)' : undefined }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img src={conv.otherUser?.avatar || '/default-avatar.svg'} alt="" className="go4k9l hp6m1n" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, fontSize: '14px' }}>{conv.otherUser?.displayName || conv.otherUser?.username}</div>
                  <div style={{ fontSize: '12px', color: 'var(--c-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {conv.lastMessage?.content || 'No messages'}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {conversations.length === 0 && (
            <div className="uc4m9n" style={{ padding: '20px' }}>
              <p style={{ fontSize: '13px', color: 'var(--c-text-muted)' }}>No conversations yet</p>
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="fb5h0i">
          {active ? (
            <>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--c-border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <img src={active.otherUser?.avatar || '/default-avatar.svg'} alt="" className="go4k9l hp6m1n" />
                <span style={{ fontWeight: 500 }}>{active.otherUser?.displayName || active.otherUser?.username}</span>
              </div>
              <div className="gc7j2k">
                {messages.map(msg => (
                  <div key={msg.id} style={{ marginBottom: '12px', display: 'flex', justifyContent: msg.sender?.id === user.id ? 'flex-end' : 'flex-start' }}>
                    <div style={{ maxWidth: '70%', padding: '8px 12px', borderRadius: 'var(--c-radius-md)', background: msg.sender?.id === user.id ? 'var(--c-accent)' : 'var(--c-bg-tertiary)', color: msg.sender?.id === user.id ? '#fff' : 'var(--c-text-primary)', fontSize: '14px' }}>
                      {msg.content}
                      <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '4px' }}>{new Date(msg.createdAt).toLocaleTimeString()}</div>
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={sendMessage} className="hd9l4m">
                <input type="text" className="dl8e3f" style={{ flex: 1 }} value={newMsg} onChange={e => setNewMsg(e.target.value)} placeholder="Type a message..." />
                <button type="submit" className="qy2e7f rz4g9h">Send</button>
              </form>
            </>
          ) : (
            <div className="uc4m9n" style={{ flex: 1 }}>
              <p style={{ color: 'var(--c-text-muted)' }}>Select a conversation to view messages</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
