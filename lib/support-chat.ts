import {
  AdminSupportChatMessage,
  AdminSupportChatThread,
  SupportChatMessageResponse,
  SupportChatThreadResponse,
  SupportChatSender,
} from '@/types/support-chat';

const parseDate = (value?: string | null): Date | null => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const mapMessageResponse = (message: SupportChatMessageResponse): AdminSupportChatMessage => ({
  id: message.id,
  sender: message.sender,
  senderId: message.senderId ?? null,
  senderName: message.senderName ?? null,
  senderRole: message.senderRole ?? null,
  content: message.content,
  createdAt: parseDate(message.createdAt) ?? new Date(),
});

export const mapThread = (thread: SupportChatThreadResponse): AdminSupportChatThread => ({
  threadId: thread.threadId,
  userId: thread.userId,
  userEmail: thread.userEmail ?? null,
  userName: thread.userName ?? null,
  userAvatar: thread.userAvatar ?? null,
  lastMessage: thread.lastMessage ?? null,
  lastSender: thread.lastSender ?? null,
  lastMessageAt: parseDate(thread.lastMessageAt),
  unreadByAdmin: thread.unreadByAdmin ?? 0,
  unreadByUser: thread.unreadByUser ?? 0,
  createdAt: parseDate(thread.createdAt),
  updatedAt: parseDate(thread.updatedAt),
  messages: Array.isArray(thread.messages) ? thread.messages.map(mapMessageResponse) : [],
});

export const mapThreadSummary = (summary: Partial<SupportChatThreadResponse>): Partial<AdminSupportChatThread> => ({
  threadId: summary.threadId ?? summary.userId ?? '',
  userId: summary.userId ?? '',
  userEmail: summary.userEmail ?? null,
  userName: summary.userName ?? null,
  userAvatar: summary.userAvatar ?? null,
  lastMessage: summary.lastMessage ?? null,
  lastSender: summary.lastSender ?? null,
  lastMessageAt: parseDate(summary.lastMessageAt),
  unreadByAdmin: summary.unreadByAdmin ?? 0,
  unreadByUser: summary.unreadByUser ?? 0,
  updatedAt: parseDate(summary.updatedAt ?? summary.lastMessageAt ?? null),
});

export const insertMessage = (
  current: AdminSupportChatMessage[],
  incoming: AdminSupportChatMessage,
): AdminSupportChatMessage[] => {
  const exists = current.some((message) => message.id === incoming.id);
  if (exists) {
    return current;
  }
  return [...current, incoming].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
  );
};

export const mergeThreadSummary = (
  thread: AdminSupportChatThread | null,
  summary: Partial<AdminSupportChatThread>,
): AdminSupportChatThread | null => {
  if (!thread) {
    return summary.threadId
      ? {
          threadId: summary.threadId,
          userId: summary.userId ?? summary.threadId,
          userEmail: summary.userEmail ?? null,
          userName: summary.userName ?? null,
          userAvatar: summary.userAvatar ?? null,
          lastMessage: summary.lastMessage ?? null,
          lastSender: summary.lastSender ?? null,
          lastMessageAt: summary.lastMessageAt ?? null,
          unreadByAdmin: summary.unreadByAdmin ?? 0,
          unreadByUser: summary.unreadByUser ?? 0,
          createdAt: null,
          updatedAt: summary.updatedAt ?? summary.lastMessageAt ?? null,
          messages: [],
        }
      : null;
  }

  return {
    ...thread,
    ...summary,
    lastMessageAt: summary.lastMessageAt ?? thread.lastMessageAt,
    unreadByAdmin: summary.unreadByAdmin ?? thread.unreadByAdmin,
    unreadByUser: summary.unreadByUser ?? thread.unreadByUser,
    updatedAt: summary.updatedAt ?? thread.updatedAt,
  };
};

export const formatRelativeTime = (date: Date | null): string => {
  if (!date) return '—';
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
};

export const formatTimestamp = (date: Date | null): string => {
  if (!date) return '';
  return `${date.toLocaleDateString()} · ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
};

export type { SupportChatThreadResponse, SupportChatMessageResponse, SupportChatSender };
