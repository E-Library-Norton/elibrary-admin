'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAppSelector } from '@/hooks/hooks';

// Backend socket URL — strip trailing /api from the REST base URL
const SOCKET_URL = (process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:5005/api').replace(/\/api\/?$/, '');

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const token = useAppSelector((s) => s.auth.accessToken);

  useEffect(() => {
    if (!token) return;

    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      auth: { token },
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
      setConnected(true);
      // Join admin room so we receive privileged events
      socket.emit('join:admin');
    });

    socket.on('disconnect', () => setConnected(false));

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [token]);

  const on = useCallback(
    (event: string, handler: (...args: unknown[]) => void) => {
      socketRef.current?.on(event, handler);
      return () => {
        socketRef.current?.off(event, handler);
      };
    },
    []
  );

  return { socket: socketRef.current, connected, on };
}
