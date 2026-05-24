'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useSearchParams } from 'next/navigation';
import { clientApi } from '@/lib/api';
import { toast } from 'sonner';
import { FiSend, FiSearch, FiPlus } from 'react-icons/fi';
import { TimeAgo } from '@/components/ui/TimeAgo';

export default function MessagesPage() {
  return (<Suspense fallback={<div className="uc4m9n"><div className="tb2k7l" /></div>}><MessagesContent /></Suspense>);
}

function MessagesContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const toUserId = searchParams.get('to');

  const [conversations, setConversations] = useState([]);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchUser, setSearchUser] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (user) loadConversations();
  }, [user]);

  // Handle ?to=userId (start conversation from profile)
  useEffect(() => {
    if (toUserId && user) {
      startConversationWith(toUserId);
    }
  }, [toUserId, user]);

  const loadConversations = async () => {
    const res = await clientApi.get('/messages/conversations');
    if (res.success) setConversations(res.data);
  };

  const loadConversation = async (conv) => {
    setActive(conv);
    const res = await clientApi.get(`/messages/conversations/${conv.id}`);
    if (res.success) setMessages(res.data);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const startConversationWith = async (recipientId) => {
    // Send a placeholder to trigger conversation creation, or check existing
    const existing = conversations.find(c => c.otherUser?.id === recipientId);
    if (existing) {
      loadConversation(existing);
    } else {
      // Fetch user info
      const res = await clientApi.get(`/users/${recipientId}/followers?limit=1`);
      // Set active with minimal info - conversation will be created on first message
      setActive({ id: null, otherUser: { id: recipientId } });
      setMessages([]);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMsg.trim() || sending) return;
    if (!active?.otherUser?.id) { toast.error('Select a conversation'); return; }

    setSending(true);
    const res = await clientApi.post('/messages', { recipientId: active.otherUser.id, content: newMsg });
    if (res.success) {
      setMessages(prev => [...prev, res.data]);
      setNewMsg('');
      loadConversations(); // Refresh list
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } else {
      toast.error(res.error?.message || 'Failed to send');
    }
    setSending(false);
  };

  const handleSearchUser = async () => {
    if (searchUser.length < 2) return;
    const res = await clientApi.get(`/users?search=${searchUser}&limit=5`);
    if (res.success) setSearchResults(res.data);
  };

  const startNewChat = (targetUser) => {
    setActive({ id: null, otherUser: targetUser });
    setMessages([]);
    setShowNewChat(false);
    setSearchUser('');
    setSearchResults([]);
  };

  if (!user) return <div className="uc4m9n"><p>Please log in to view messages.</p></div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Messages</h1>
        <button onClick={() => setShowNewChat(!showNewChat)} className="qy2e7f rz4g9h vd2o7p">
          <FiPlus size={14} /> New Chat
        </button>
      </div>

      {/* New Chat Search */}
      {showNewChat && (
        <div className="xf6s1t" style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <input className="dl8e3f" style={{ flex: 1 }} value={searchUser} onChange={e => setSearchUser(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearchUser()} placeholder="Search username..." />
            <button onClick={handleSearchUser} className="qy2e7f tb8k3l vd2o7p"><FiSearch size={14} /></button>
          </div>
          {searchResults.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {searchResults.filter(u => u.id !== user.id).map(u => (
                <button key={u.id} onClick={() => startNewChat(u)} className="ai4y9z">
                  <img src={u.avatar || '/default-avatar.svg'} alt="" className="go4k9l hp6m1n" style={{ borderRadius: '50%' }} />
                  <span style={{ fontWeight: 500 }}>{u.displayName || u.username}</span>
                  <span style={{ fontSize: '12px', color: 'var(--c-text-muted)' }}>@{u.username}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="dz1d6e">
        {/* Conversation List */}
        <div className="ea3f8g">
          {conversations.map(conv => (
            <div key={conv.id} onClick={() => loadConversation(conv)} className="zh0w5x" style={{ cursor: 'pointer', padding: '12px 16px', background: active?.id === conv.id ? 'var(--c-bg-hover)' : undefined }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img src={conv.otherUser?.avatar || '/default-avatar.svg'} alt="" className="go4k9l hp6m1n" style={{ borderRadius: '50%' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, fontSize: '14px' }}>{conv.otherUser?.displayName || conv.otherUser?.username}</div>
                  <div style={{ fontSize: '12px', color: 'var(--c-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {conv.lastMessage?.content || 'No messages'}
                  </div>
                </div>
                {conv.lastMessageAt && (
                  <span style={{ fontSize: '11px', color: 'var(--c-text-muted)', whiteSpace: 'nowrap' }}>
                    <TimeAgo date={conv.lastMessageAt} />
                  </span>
                )}
              </div>
            </div>
          ))}
          {conversations.length === 0 && (
            <div className="uc4m9n" style={{ padding: '20px' }}>
              <p style={{ fontSize: '13px', color: 'var(--c-text-muted)', textAlign: 'center' }}>No conversations yet.<br />Click "New Chat" to start one.</p>
            </div>
          )}
        </div>

        {/* Messages Panel */}
        <div className="fb5h0i">
          {active ? (
            <>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--c-border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img src={active.otherUser?.avatar || '/default-avatar.svg'} alt="" className="go4k9l hp6m1n" style={{ borderRadius: '50%' }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>{active.otherUser?.displayName || active.otherUser?.username}</div>
                  {active.otherUser?.username && <div style={{ fontSize: '12px', color: 'var(--c-text-muted)' }}>@{active.otherUser.username}</div>}
                </div>
              </div>
              <div className="gc7j2k">
                {messages.length === 0 && (
                  <div className="uc4m9n" style={{ flex: 1 }}>
                    <p style={{ color: 'var(--c-text-muted)', fontSize: '14px' }}>Start the conversation! Send a message below.</p>
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
              <form onSubmit={sendMessage} className="hd9l4m">
                <input type="text" className="dl8e3f" style={{ flex: 1 }} value={newMsg} onChange={e => setNewMsg(e.target.value)} placeholder="Type a message..." autoFocus />
                <button type="submit" className="qy2e7f rz4g9h" disabled={sending || !newMsg.trim()}>
                  <FiSend size={16} />
                </button>
              </form>
            </>
          ) : (
            <div className="uc4m9n" style={{ flex: 1, flexDirection: 'column', gap: '8px' }}>
              <FiMessageSquare size={40} style={{ color: 'var(--c-text-muted)', opacity: 0.4 }} />
              <p style={{ color: 'var(--c-text-muted)', fontSize: '14px' }}>Select a conversation or start a new chat</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
