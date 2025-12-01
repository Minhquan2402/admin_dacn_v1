export type SupportChatSender = 'user' | 'admin' | 'system';

export interface SupportChatMessageResponse {
  id: string;
  sender: SupportChatSender;
  senderId?: string | null;
  senderName?: string | null;
  senderRole?: string | null;
  content: string;
  createdAt: string;
}

export interface SupportChatThreadResponse {
  threadId: string;
  userId: string;
  userEmail?: string | null;
  userName?: string | null;
  userAvatar?: string | null;
  lastMessage?: string | null;
  lastSender?: SupportChatSender | null;
  lastMessageAt?: string | null;
  unreadByAdmin?: number;
  unreadByUser?: number;
  createdAt?: string | null;
  updatedAt?: string | null;
  messages?: SupportChatMessageResponse[];
}

export interface AdminSupportChatMessage {
  id: string;
  sender: SupportChatSender;
  senderId?: string | null;
  senderName?: string | null;
  senderRole?: string | null;
  content: string;
  createdAt: Date;
}

export interface AdminSupportChatThread {
  threadId: string;
  userId: string;
  userEmail?: string | null;
  userName?: string | null;
  userAvatar?: string | null;
  lastMessage?: string | null;
  lastSender?: SupportChatSender | null;
  lastMessageAt: Date | null;
  unreadByAdmin: number;
  unreadByUser: number;
  createdAt: Date | null;
  updatedAt: Date | null;
  messages: AdminSupportChatMessage[];
}
