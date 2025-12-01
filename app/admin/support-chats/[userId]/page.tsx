"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Loader2, MessageCircle, Send, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api';
import {
  AdminSupportChatMessage,
  AdminSupportChatThread,
  SupportChatMessageResponse,
  SupportChatThreadResponse,
} from '@/types/support-chat';
import {
  formatTimestamp,
  insertMessage,
  mapMessageResponse,
  mapThread,
  mapThreadSummary,
} from '@/lib/support-chat';
import { useAdminSupportChatSocket, AdminChatSocketStatus } from '@/hooks/useAdminSupportChatSocket';
import { useAuth } from '@/contexts/auth-context';

const SOCKET_STATUS_COPY: Record<AdminChatSocketStatus, { label: string; color: string }> = {
  connected: { label: 'Realtime live', color: 'bg-emerald-100 text-emerald-700' },
  connecting: { label: 'Connecting…', color: 'bg-amber-100 text-amber-700' },
  disconnected: { label: 'Offline', color: 'bg-gray-200 text-gray-600' },
};

const SupportChatDetailPage = () => {
  const params = useParams<{ userId: string }>();
  const userId = Array.isArray(params.userId) ? params.userId[0] : params.userId;
  const { user } = useAuth();

  const [thread, setThread] = useState<AdminSupportChatThread | null>(null);
  const [messages, setMessages] = useState<AdminSupportChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setLoading] = useState(true);
  const [isSending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [socketStatus, setSocketStatus] = useState<AdminChatSocketStatus>('disconnected');
  const messagesRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = useCallback(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTo({ top: messagesRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const markThreadAsRead = useCallback(async () => {
    try {
      await apiClient.markSupportChatThreadReadByAdmin(userId);
      setThread((prev) => (prev ? { ...prev, unreadByAdmin: 0 } : prev));
    } catch (err) {
      console.error('Failed to mark chat as read', err);
    }
  }, [userId]);

  const loadThread = useCallback(async () => {
    setLoading(true);
    try {
      const response: SupportChatThreadResponse = await apiClient.getSupportChatThreadByUser(userId);
      const normalized = mapThread(response);
      setThread(normalized);
      setMessages(normalized.messages);
      setError(null);
      markThreadAsRead();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [markThreadAsRead, userId]);

  useEffect(() => {
    loadThread();
  }, [loadThread]);

  const handleSend = useCallback(async () => {
    const content = inputValue.trim();
    if (!content) return;
    setSending(true);
    try {
      const result = await apiClient.sendSupportChatMessageToUser(userId, content);
      const normalizedThread = result?.thread ? mapThread(result.thread) : null;
      const normalizedMessage = result?.message ? mapMessageResponse(result.message) : null;
      if (normalizedThread) {
        setThread((prev) => ({ ...(prev ?? normalizedThread), ...normalizedThread, messages: prev?.messages ?? [] }));
      }
      if (normalizedMessage) {
        setMessages((prev) => insertMessage(prev, normalizedMessage));
      }
      setInputValue('');
      markThreadAsRead();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSending(false);
    }
  }, [inputValue, markThreadAsRead, userId]);

  const handleIncomingSummary = useCallback((summary: Partial<SupportChatThreadResponse>) => {
    if (!summary?.userId || summary.userId !== userId) return;
    const normalized = mapThreadSummary(summary);
    setThread((prev) => (prev ? {
      ...prev,
      ...normalized,
      lastMessageAt: normalized.lastMessageAt ?? prev.lastMessageAt,
      unreadByAdmin: normalized.unreadByAdmin ?? prev.unreadByAdmin,
    } : prev));
  }, [userId]);

  const handleIncomingMessage = useCallback((payload: { summary?: Partial<SupportChatThreadResponse>; message: SupportChatMessageResponse }) => {
    if (payload.summary?.userId !== userId) return;
    const isoCreatedAt = typeof payload.message.createdAt === 'string'
      ? payload.message.createdAt
      : new Date(payload.message.createdAt).toISOString();
    handleIncomingSummary({
      ...payload.summary,
      lastMessage: payload.summary?.lastMessage ?? payload.message.content,
      lastSender: payload.summary?.lastSender ?? payload.message.sender,
      lastMessageAt: payload.summary?.lastMessageAt ?? isoCreatedAt,
    });
    setMessages((prev) => insertMessage(prev, mapMessageResponse({ ...payload.message, createdAt: isoCreatedAt })));
    if (payload.message.sender === 'user') {
      markThreadAsRead();
    }
  }, [handleIncomingSummary, markThreadAsRead, userId]);

  useAdminSupportChatSocket({
    adminId: user?.id,
    onStatusChange: setSocketStatus,
    onMessage: handleIncomingMessage,
    onThreadUpdate: handleIncomingSummary,
  });

  const statusCopy = SOCKET_STATUS_COPY[socketStatus];
  const canSend = Boolean(inputValue.trim()) && !isSending;

  const headerTitle = useMemo(() => thread?.userName || thread?.userEmail || `User ${userId.slice(-4)}`, [thread, userId]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/admin/support-chats" className="inline-flex items-center gap-2 text-sm font-semibold text-orange-600 hover:text-orange-700">
            <ArrowLeft className="h-4 w-4" />
            Back to inbox
          </Link>
          <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${statusCopy.color}`}>
            {socketStatus === 'disconnected' ? <WifiOff className="h-3.5 w-3.5" /> : <MessageCircle className="h-3.5 w-3.5" />}
            {statusCopy.label}
          </div>
        </div>
        {thread?.unreadByAdmin ? (
          <Badge variant="secondary" className="bg-orange-100 text-orange-700">
            {thread.unreadByAdmin} unread
          </Badge>
        ) : null}
      </div>

      <Card className="overflow-hidden h-[100vh] -mt-2 ">
        <CardContent className="flex h-full flex-col gap-4 p-0">
          <div className="border-b border-gray-100 bg-gradient-to-r from-white via-orange-50/60 to-white px-6 py-2 -mt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-lg font-semibold text-orange-600">
                {headerTitle[0]?.toUpperCase()}
              </div>
              <div>
                <p className="text-base font-semibold text-gray-900">{headerTitle}</p>
                <p className="text-xs text-gray-500">{thread?.userEmail}</p>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-1 items-center justify-center gap-2 py-12 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading conversation…
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <p className="text-sm text-red-600">{error}</p>
              <Button variant="outline" onClick={loadThread}>Retry</Button>
            </div>
          ) : (
            <>
              <div ref={messagesRef} className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto bg-white px-6 py-6">
                {messages.length === 0 ? (
                  <div className="flex flex-1 items-center justify-center text-sm text-gray-500">
                    No messages yet. Say hello!
                  </div>
                ) : (
                  messages.map((message) => {
                    const isAdminMessage = message.sender === 'admin';
                    return (
                      <div key={message.id} className={`flex ${isAdminMessage ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm shadow-sm ${isAdminMessage ? 'rounded-br-sm bg-gradient-to-r from-orange-500 to-rose-500 text-white' : 'rounded-bl-sm bg-gray-100 text-gray-800'}`}>
                          <p className="whitespace-pre-line leading-relaxed">{message.content}</p>
                          <span className={`mt-2 block text-xs ${isAdminMessage ? 'text-orange-100' : 'text-gray-400'}`}>
                            {formatTimestamp(message.createdAt)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="border-t border-gray-100 bg-gray-50/80 px-6 py-4">
                <form
                  className="flex flex-col gap-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (canSend) handleSend();
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Textarea
                      value={inputValue}
                      onChange={(event) => setInputValue(event.target.value)}
                      placeholder="Type what you need help with..."
                      className="flex-1 h-11 min-h-0 resize-none rounded-full bg-white px-4 py-2 leading-tight border border-orange-200 focus:border-orange-400 focus:ring-0"
                      rows={1}
                      disabled={isSending}
                      aria-label="Reply to user"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          if (inputValue.trim() && !isSending) {
                            handleSend();
                          }
                        }
                      }}
                    />
                    <Button type="submit" disabled={!canSend} className="gap-2 px-4 py-2 rounded-full">
                      {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      {isSending ? 'Sending…' : 'Send reply'}
                    </Button>
                  </div>
                </form>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SupportChatDetailPage;
