'use client';

import { useEffect, useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchConversations,
  fetchConversation,
  fetchMessages,
  fetchUnreadCount,
  connectSocket,
  joinConversation,
  leaveConversation,
  sendMessage as wsSendMessage,
  markRead as wsMarkRead,
} from '@/lib/messaging';
import { useAuth } from './use-auth';

export function useConversations() {
  return useQuery({
    queryKey: ['messaging', 'conversations'],
    queryFn: fetchConversations,
    staleTime: 30_000,
  });
}

export function useConversation(id: string) {
  return useQuery({
    queryKey: ['messaging', 'conversation', id],
    queryFn: () => fetchConversation(id),
    enabled: !!id,
  });
}

export function useMessages(conversationId: string) {
  return useQuery({
    queryKey: ['messaging', 'messages', conversationId],
    queryFn: () => fetchMessages(conversationId),
    enabled: !!conversationId,
    refetchInterval: false,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ['messaging', 'unread'],
    queryFn: fetchUnreadCount,
    staleTime: 15_000,
  });
}

export function useMessaging(conversationId?: string) {
  const { accessToken, user } = useAuth();
  const qc = useQueryClient();
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user?.id || !accessToken) return;

    const socket = connectSocket(user.id, accessToken);

    if (conversationId) {
      joinConversation(conversationId);
    }

    socket.on('message:new', (message: any) => {
      qc.invalidateQueries({ queryKey: ['messaging', 'messages', message.conversationId] });
      qc.invalidateQueries({ queryKey: ['messaging', 'conversations'] });
      qc.invalidateQueries({ queryKey: ['messaging', 'unread'] });
    });

    socket.on('message:read', () => {
      qc.invalidateQueries({ queryKey: ['messaging'] });
    });

    socket.on('typing:update', ({ userId: typingUserId, typing }: { userId: string; typing: boolean }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        if (typing) next.add(typingUserId);
        else next.delete(typingUserId);
        return next;
      });
    });

    return () => {
      if (conversationId) {
        leaveConversation(conversationId);
      }
    };
  }, [user?.id, accessToken, conversationId, qc]);

  const sendMessage = useCallback(
    (content: string, type = 'text', mediaUrl?: string) => {
      if (conversationId) {
        wsSendMessage(conversationId, content, type, mediaUrl);
      }
    },
    [conversationId],
  );

  const markRead = useCallback(() => {
    if (conversationId) {
      wsMarkRead(conversationId);
    }
  }, [conversationId]);

  return { sendMessage, markRead, onlineUsers };
}
