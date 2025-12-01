"use client"

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { MessageCircle, Search, Loader2, WifiOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient } from '@/lib/api';
import { AdminSupportChatThread } from '@/types/support-chat';
import { formatRelativeTime, mapThread, mapThreadSummary, type SupportChatMessageResponse, type SupportChatThreadResponse } from '@/lib/support-chat';
import { useAdminSupportChatSocket, AdminChatSocketStatus } from '@/hooks/useAdminSupportChatSocket';
import { useAuth } from '@/contexts/auth-context';

const sortThreads = (items: AdminSupportChatThread[]) =>
  [...items].sort(
    (a, b) => (b.lastMessageAt?.getTime() ?? 0) - (a.lastMessageAt?.getTime() ?? 0),
  );

const SOCKET_STATUS_COPY: Record<AdminChatSocketStatus, { label: string; color: string }> = {
  connected: { label: 'Realtime live', color: 'bg-emerald-100 text-emerald-700' },
  connecting: { label: 'Connecting…', color: 'bg-amber-100 text-amber-700' },
  disconnected: { label: 'Offline', color: 'bg-gray-200 text-gray-600' },
};

const useDebouncedValue = (value: string, delay = 400) => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const handle = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handle);
  }, [value, delay]);

  return debounced;
};

const SupportChatsPage = () => {
  const { user } = useAuth();
  const [threads, setThreads] = useState<AdminSupportChatThread[]>([]);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const debouncedSearch = useDebouncedValue(searchValue.trim());
  const [socketStatus, setSocketStatus] = useState<AdminChatSocketStatus>('disconnected');

  const fetchThreads = useCallback(async (keyword?: string) => {
    setLoading(true);
    try {
      const response = await apiClient.getSupportChatThreads(keyword ? { search: keyword } : undefined);
      const payload = Array.isArray(response) ? response : response?.data ?? [];
      setThreads(sortThreads(payload.map(mapThread)));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchThreads(debouncedSearch || undefined);
  }, [debouncedSearch, fetchThreads]);

  const applySummary = useCallback((summaryInput: Parameters<typeof mapThreadSummary>[0]) => {
    setThreads((prev) => {
      const normalized = mapThreadSummary(summaryInput);
      if (!normalized.userId) return prev;
      const updated = [...prev];
      const index = updated.findIndex((item) => item.userId === normalized.userId);
      if (index >= 0) {
        updated[index] = {
          ...updated[index],
          ...normalized,
          lastMessageAt: normalized.lastMessageAt ?? updated[index].lastMessageAt,
          unreadByAdmin: normalized.unreadByAdmin ?? updated[index].unreadByAdmin,
          unreadByUser: normalized.unreadByUser ?? updated[index].unreadByUser,
        };
      } else if (normalized.threadId) {
        updated.unshift({
          threadId: normalized.threadId,
          userId: normalized.userId,
          userEmail: normalized.userEmail ?? null,
          userName: normalized.userName ?? null,
          userAvatar: normalized.userAvatar ?? null,
          lastMessage: normalized.lastMessage ?? null,
          lastSender: normalized.lastSender ?? null,
          lastMessageAt: normalized.lastMessageAt ?? null,
          unreadByAdmin: normalized.unreadByAdmin ?? 0,
          unreadByUser: normalized.unreadByUser ?? 0,
          createdAt: null,
          updatedAt: normalized.updatedAt ?? normalized.lastMessageAt ?? null,
          messages: [],
        });
      }
      return sortThreads(updated);
    });
  }, []);

  const handleSocketMessage = useCallback(
    (payload: { summary?: Partial<SupportChatThreadResponse>; message: SupportChatMessageResponse }) => {
      if (!payload?.message) return;
      const createdAtISO = typeof payload.message.createdAt === 'string'
        ? payload.message.createdAt
        : new Date(payload.message.createdAt).toISOString();

      applySummary({
        ...payload.summary,
        userId: payload.summary?.userId,
        lastMessage: payload.summary?.lastMessage ?? payload.message.content,
        lastSender: payload.summary?.lastSender ?? payload.message.sender,
        lastMessageAt: payload.summary?.lastMessageAt ?? createdAtISO,
      });
    },
    [applySummary],
  );

  const handleThreadUpdate = useCallback(
    (summary: Partial<SupportChatThreadResponse>) => {
      applySummary(summary);
    },
    [applySummary],
  );

  useAdminSupportChatSocket({
    adminId: user?.id,
    onStatusChange: setSocketStatus,
    onMessage: handleSocketMessage,
    onThreadUpdate: handleThreadUpdate,
  });

  const filteredThreads = useMemo(() => threads, [threads]);
  const statusCopy = SOCKET_STATUS_COPY[socketStatus];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-orange-500">Customer happiness</p>
          <h1 className="text-2xl font-bold text-gray-900">Support chats</h1>
          <p className="text-sm text-gray-500">Monitor every conversation and jump in instantly.</p>
        </div>
        <div className={`inline-flex items-center gap-2 rounded-full px-4 py-1 text-sm font-semibold ${statusCopy.color}`}>
          {socketStatus === 'disconnected' ? <WifiOff className="h-4 w-4" /> : <MessageCircle className="h-4 w-4" />}
          {statusCopy.label}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold text-gray-800">Inbox</CardTitle>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Search by name or email"
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading conversations…
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <p className="text-sm text-red-600">{error}</p>
              <button
                type="button"
                className="text-sm font-semibold text-orange-600 hover:text-orange-700"
                onClick={() => fetchThreads(debouncedSearch || undefined)}
              >
                Try again
              </button>
            </div>
          ) : filteredThreads.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center text-sm text-gray-500">
              <MessageCircle className="h-8 w-8 text-gray-300" />
              No conversations yet.
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {filteredThreads.map((thread) => (
                <li key={thread.threadId} className="transition hover:bg-orange-50/40">
                  <Link href={`/admin/support-chats/${thread.userId}`} className="flex items-center gap-4 px-4 py-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                      {thread.userName?.[0]?.toUpperCase() ?? thread.userEmail?.[0]?.toUpperCase() ?? 'U'}
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-gray-900">
                          {thread.userName || thread.userEmail || `User ${thread.userId.slice(-4)}`}
                        </p>
                        {thread.unreadByAdmin > 0 && (
                          <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                            {thread.unreadByAdmin > 99 ? '99+' : thread.unreadByAdmin} new
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 line-clamp-1">{thread.lastMessage || 'No messages yet'}</p>
                    </div>
                    <div className="text-right text-xs text-gray-400">
                      {formatRelativeTime(thread.lastMessageAt || thread.updatedAt)}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SupportChatsPage;
