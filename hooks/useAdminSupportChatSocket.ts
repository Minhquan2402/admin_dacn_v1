"use client"

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type { SupportChatMessageResponse, SupportChatThreadResponse } from '@/lib/support-chat';

export type AdminChatSocketStatus = 'disconnected' | 'connecting' | 'connected';

interface SocketOptions {
  adminId?: string | null;
  onMessage?: (payload: { summary?: Partial<SupportChatThreadResponse>; message: SupportChatMessageResponse }) => void;
  onThreadUpdate?: (summary: Partial<SupportChatThreadResponse>) => void;
  onStatusChange?: (status: AdminChatSocketStatus) => void;
}

const getSocketUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL;
  if (envUrl) return envUrl.replace(/\/$/, '');
  if (typeof window !== 'undefined') return window.location.origin.replace(/\/$/, '');
  return 'http://localhost:5000';
};

export const useAdminSupportChatSocket = ({ adminId, onMessage, onThreadUpdate, onStatusChange }: SocketOptions) => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const url = getSocketUrl();
    const socket = io(url, { transports: ['websocket', 'polling'], withCredentials: true });
    socketRef.current = socket;
    onStatusChange?.('connecting');

    socket.on('connect', () => {
      onStatusChange?.('connected');
      socket.emit('support-chat:join-admin', { adminId });
    });

    socket.on('disconnect', () => {
      onStatusChange?.('disconnected');
    });

    socket.on('support-chat:new-message', (payload: { summary?: Partial<SupportChatThreadResponse>; message?: SupportChatMessageResponse }) => {
      if (!payload?.message) return;
      onMessage?.({ summary: payload.summary, message: payload.message });
    });

    socket.on('support-chat:thread-update', (summary: Partial<SupportChatThreadResponse>) => {
      onThreadUpdate?.(summary);
    });

    return () => {
      socket.disconnect();
      onStatusChange?.('disconnected');
    };
  }, [adminId, onMessage, onThreadUpdate, onStatusChange]);

  return socketRef;
};
