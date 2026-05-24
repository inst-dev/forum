'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthProvider';
import { io } from 'socket.io-client';

const SocketContext = createContext({ socket: null, connected: false });

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:6395';

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setConnected(false);
      }
      return;
    }

    // Get auth token from cookie (the session token)
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('nf_access='))
      ?.split('=')[1] || '';

    if (!token) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    socket.on('connect', () => {
      setConnected(true);
      console.log('[Socket] Connected');
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.log('[Socket] Connection error:', err.message);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
