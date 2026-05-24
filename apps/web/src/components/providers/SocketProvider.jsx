'use client';

import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from './AuthProvider';
import { io } from 'socket.io-client';
import { clientApi } from '@/lib/api';

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

    // Fetch socket auth token from API (bypasses HttpOnly cookie restriction)
    async function connectSocket() {
      try {
        const res = await clientApi.get('/auth/socket-token');
        if (!res.success || !res.data?.token) return;

        const socket = io(SOCKET_URL, {
          auth: { token: res.data.token },
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionDelay: 2000,
          reconnectionAttempts: 15,
        });

        socket.on('connect', () => {
          setConnected(true);
        });

        socket.on('disconnect', () => {
          setConnected(false);
        });

        socket.on('connect_error', (err) => {
          console.log('[Socket] Error:', err.message);
          setConnected(false);
        });

        socketRef.current = socket;
      } catch (err) {
        console.log('[Socket] Failed to get token');
      }
    }

    connectSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setConnected(false);
      }
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
