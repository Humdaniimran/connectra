import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Chat, Message, MessageAttachment, MessageType, User } from '../types/index.ts';
import { api } from '../services/api.ts';
import { socket } from '../services/socket.ts';
import { soundEffects } from '../services/audioTones.ts';
import { useAuth } from './AuthContext.tsx';

interface ChatContextType {
  chats: Chat[];
  activeChat: Chat | null;
  messages: Message[];
  isLoadingChats: boolean;
  isLoadingMessages: boolean;
  typingUsers: Record<string, string[]>; // chatId -> userNames[]
  drafts: Record<string, string>; // chatId -> draftText
  replyingTo: Message | null;
  editingMessage: Message | null;
  setActiveChat: (chat: Chat | null) => void;
  sendMessage: (content: string, type?: MessageType, attachment?: MessageAttachment) => Promise<void>;
  editMessage: (messageId: string, newContent: string) => Promise<void>;
  deleteMessage: (messageId: string, forEveryone: boolean) => Promise<void>;
  reactToMessage: (messageId: string, emoji: string) => Promise<void>;
  pinMessage: (messageId: string, isPinned: boolean) => Promise<void>;
  starMessage: (messageId: string) => void;
  forwardMessage: (targetChatId: string, message: Message) => Promise<void>;
  setReplyingTo: (msg: Message | null) => void;
  setEditingMessage: (msg: Message | null) => void;
  setDraft: (chatId: string, draft: string) => void;
  startTyping: () => void;
  stopTyping: () => void;
  createDirectChat: (recipientUserId: string) => Promise<Chat>;
  createGroupChat: (name: string, description: string, participantIds: string[], avatar?: string) => Promise<Chat>;
  clearChatHistory: (chatId: string) => Promise<void>;
  toggleArchiveChat: (chatId: string) => void;
  togglePinChat: (chatId: string) => void;
  toggleMuteChat: (chatId: string) => void;
  refreshChats: () => Promise<void>;
  starredMessageIds: Set<string>;
  incomingNotification: {
    message: Message;
    sender: User | null;
    chatTitle: string;
  } | null;
  dismissNotification: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser, allUsers } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChatState] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [starredMessageIds, setStarredMessageIds] = useState<Set<string>>(new Set());
  const [incomingNotification, setIncomingNotification] = useState<{
    message: Message;
    sender: User | null;
    chatTitle: string;
  } | null>(null);

  const notificationTimeoutRef = React.useRef<number | null>(null);

  const dismissNotification = () => {
    setIncomingNotification(null);
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
      notificationTimeoutRef.current = null;
    }
  };

  // Typing debounce timer
  const typingTimeoutRef = React.useRef<number | null>(null);

  const refreshChats = async () => {
    if (!currentUser) return;
    try {
      const userChats = await api.getChats(currentUser.id);
      setChats(userChats);
      // If no active chat on desktop, select first chat
      if (!activeChat && userChats.length > 0 && window.innerWidth >= 1024) {
        setActiveChat(userChats[0]);
      }
    } catch (err) {
      console.error('Failed to load chats:', err);
    } finally {
      setIsLoadingChats(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      refreshChats();
    }
  }, [currentUser?.id]);

  // Load messages whenever activeChat changes
  useEffect(() => {
    if (!activeChat) {
      setMessages([]);
      return;
    }

    let isMounted = true;
    setIsLoadingMessages(true);

    api.getMessages(activeChat.id)
      .then((msgs) => {
        if (isMounted) {
          setMessages(msgs);
          setIsLoadingMessages(false);
          // Mark messages as read
          if (currentUser) {
            socket.send('message:mark_read', { chatId: activeChat.id, userId: currentUser.id });
          }
        }
      })
      .catch((err) => {
        console.error('Failed to fetch messages for chat:', err);
        if (isMounted) setIsLoadingMessages(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeChat?.id, currentUser?.id]);

  // WebSocket subscriptions for real-time messages & updates
  useEffect(() => {
    const unsubNewMsg = socket.on('message:new', (newMsg: Message) => {
      // If message is in current active chat, append to messages
      if (activeChat && newMsg.chatId === activeChat.id) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        if (currentUser && newMsg.senderId !== currentUser.id) {
          socket.send('message:mark_read', { chatId: activeChat.id, userId: currentUser.id });
        }
      }

      // Play sound & notify if incoming from someone else
      if (currentUser && newMsg.senderId !== currentUser.id) {
        soundEffects.playMessageReceived();

        // If not looking at this chat, show notification
        if (!activeChat || activeChat.id !== newMsg.chatId) {
          const senderUser = allUsers.find((u) => u.id === newMsg.senderId) || null;
          const targetChat = chats.find((c) => c.id === newMsg.chatId);
          const chatTitle = targetChat?.name || senderUser?.name || 'New Message';

          setIncomingNotification({
            message: newMsg,
            sender: senderUser,
            chatTitle,
          });

          if (notificationTimeoutRef.current) {
            clearTimeout(notificationTimeoutRef.current);
          }
          notificationTimeoutRef.current = window.setTimeout(() => {
            setIncomingNotification(null);
          }, 5000);

          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification(chatTitle, {
                body: newMsg.type === 'text' ? newMsg.content : `[${newMsg.type}]`,
                icon: senderUser?.avatar,
              });
            } catch {
              // Ignore notification error
            }
          }
        }
      }

      // Update chats list
      setChats((prev) =>
        prev.map((c) => {
          if (c.id === newMsg.chatId) {
            return {
              ...c,
              lastMessage: newMsg,
              unreadCount:
                activeChat?.id === c.id || newMsg.senderId === currentUser?.id
                  ? 0
                  : (c.unreadCount || 0) + 1,
            };
          }
          return c;
        })
      );
    });

    const unsubUpdatedMsg = socket.on('message:updated', (updatedMsg: Message) => {
      if (activeChat && updatedMsg.chatId === activeChat.id) {
        setMessages((prev) =>
          prev.map((m) => (m.id === updatedMsg.id ? updatedMsg : m))
        );
      }
    });

    const unsubReaction = socket.on('message:reaction_updated', (payload: { chatId: string; messageId: string; reactions: Record<string, string[]> }) => {
      if (activeChat && payload.chatId === activeChat.id) {
        setMessages((prev) =>
          prev.map((m) => (m.id === payload.messageId ? { ...m, reactions: payload.reactions } : m))
        );
      }
    });

    const unsubRead = socket.on('message:read_receipt', (payload: { chatId: string; readByUserId: string }) => {
      if (activeChat && payload.chatId === activeChat.id) {
        setMessages((prev) =>
          prev.map((m) => (m.senderId === currentUser?.id ? { ...m, status: 'read' } : m))
        );
      }
      setChats((prev) =>
        prev.map((c) => (c.id === payload.chatId ? { ...c, unreadCount: 0 } : c))
      );
    });

    const unsubTyping = socket.on('typing:update', (payload: { chatId: string; userId: string; userName: string; isTyping: boolean }) => {
      setTypingUsers((prev) => {
        const currentInChat = prev[payload.chatId] || [];
        if (payload.isTyping) {
          if (!currentInChat.includes(payload.userName)) {
            return { ...prev, [payload.chatId]: [...currentInChat, payload.userName] };
          }
        } else {
          return { ...prev, [payload.chatId]: currentInChat.filter((name) => name !== payload.userName) };
        }
        return prev;
      });
    });

    const unsubPinned = socket.on('message:pinned_updated', (payload: { messageId: string; isPinned: boolean }) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === payload.messageId ? { ...m, isPinned: payload.isPinned } : m))
      );
    });

    const unsubChatCreated = socket.on('chat:created', (newChat: Chat) => {
      setChats((prev) => {
        if (prev.some((c) => c.id === newChat.id)) return prev;
        return [newChat, ...prev];
      });
    });

    const unsubChatCleared = socket.on('chat:cleared', (payload: { chatId: string }) => {
      if (activeChat?.id === payload.chatId) {
        setMessages([]);
      }
      setChats((prev) =>
        prev.map((c) => (c.id === payload.chatId ? { ...c, lastMessage: undefined } : c))
      );
    });

    return () => {
      unsubNewMsg();
      unsubUpdatedMsg();
      unsubReaction();
      unsubRead();
      unsubTyping();
      unsubPinned();
      unsubChatCreated();
      unsubChatCleared();
    };
  }, [activeChat?.id, currentUser?.id]);

  const setActiveChat = (chat: Chat | null) => {
    setActiveChatState(chat);
    setReplyingTo(null);
    setEditingMessage(null);
  };

  const setDraft = (chatId: string, draft: string) => {
    setDrafts((prev) => ({ ...prev, [chatId]: draft }));
  };

  const startTyping = () => {
    if (!activeChat || !currentUser) return;
    socket.send('typing:start', {
      chatId: activeChat.id,
      userId: currentUser.id,
      userName: currentUser.name,
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = window.setTimeout(() => {
      stopTyping();
    }, 3000);
  };

  const stopTyping = () => {
    if (!activeChat || !currentUser) return;
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    socket.send('typing:stop', {
      chatId: activeChat.id,
      userId: currentUser.id,
      userName: currentUser.name,
    });
  };

  const sendMessage = async (
    content: string,
    type: MessageType = 'text',
    attachment?: MessageAttachment
  ) => {
    if (!activeChat || !currentUser) return;

    // Check admin-only post permission in group
    if (activeChat.onlyAdminsCanPost && !activeChat.adminIds?.includes(currentUser.id)) {
      alert('Only administrators can send messages in this group.');
      return;
    }

    stopTyping();

    const replyData = replyingTo
      ? {
          id: replyingTo.id,
          senderName:
            allUsers.find((u) => u.id === replyingTo.senderId)?.name || 'User',
          content: replyingTo.content || (replyingTo.type === 'image' ? '📷 Photo' : '📎 Attachment'),
          type: replyingTo.type,
        }
      : undefined;

    socket.send('message:send', {
      chatId: activeChat.id,
      senderId: currentUser.id,
      content,
      type,
      attachment,
      replyTo: replyData,
    });

    soundEffects.playMessageSent();
    setReplyingTo(null);
    // clear draft
    setDraft(activeChat.id, '');
  };

  const editMessage = async (messageId: string, newContent: string) => {
    if (!activeChat) return;
    socket.send('message:edit', {
      chatId: activeChat.id,
      messageId,
      newContent,
    });
    setEditingMessage(null);
  };

  const deleteMessage = async (messageId: string, forEveryone: boolean) => {
    if (!activeChat || !currentUser) return;
    socket.send('message:delete', {
      chatId: activeChat.id,
      messageId,
      forEveryone,
      userId: currentUser.id,
    });
  };

  const reactToMessage = async (messageId: string, emoji: string) => {
    if (!activeChat || !currentUser) return;
    socket.send('message:react', {
      chatId: activeChat.id,
      messageId,
      emoji,
      userId: currentUser.id,
    });
  };

  const pinMessage = async (messageId: string, isPinned: boolean) => {
    if (!activeChat) return;
    try {
      await api.pinMessage(activeChat.id, messageId, isPinned);
    } catch (e) {
      console.error('Failed to pin message:', e);
    }
  };

  const starMessage = (messageId: string) => {
    setStarredMessageIds((prev) => {
      const copy = new Set(prev);
      if (copy.has(messageId)) {
        copy.delete(messageId);
      } else {
        copy.add(messageId);
      }
      return copy;
    });
  };

  const forwardMessage = async (targetChatId: string, message: Message) => {
    if (!currentUser) return;
    socket.send('message:send', {
      chatId: targetChatId,
      senderId: currentUser.id,
      content: message.content,
      type: message.type,
      attachment: message.attachment,
      forwarded: true,
    });
  };

  const createDirectChat = async (recipientUserId: string): Promise<Chat> => {
    if (!currentUser) throw new Error('Not logged in');
    const newChat = await api.createChat({
      type: 'direct',
      participantIds: [currentUser.id, recipientUserId],
      creatorId: currentUser.id,
    });
    await refreshChats();
    setActiveChat(newChat);
    return newChat;
  };

  const createGroupChat = async (
    name: string,
    description: string,
    participantIds: string[],
    avatar?: string
  ): Promise<Chat> => {
    if (!currentUser) throw new Error('Not logged in');
    const newChat = await api.createChat({
      type: 'group',
      name,
      description,
      participantIds: [...new Set([currentUser.id, ...participantIds])],
      avatar,
      creatorId: currentUser.id,
    });
    await refreshChats();
    setActiveChat(newChat);
    return newChat;
  };

  const clearChatHistory = async (chatId: string) => {
    await api.clearChat(chatId);
    if (activeChat?.id === chatId) {
      setMessages([]);
    }
  };

  const toggleArchiveChat = (chatId: string) => {
    setChats((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, isArchived: !c.isArchived } : c))
    );
  };

  const togglePinChat = (chatId: string) => {
    setChats((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, isPinned: !c.isPinned } : c))
    );
  };

  const toggleMuteChat = (chatId: string) => {
    setChats((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, isMuted: !c.isMuted } : c))
    );
  };

  return (
    <ChatContext.Provider
      value={{
        chats,
        activeChat,
        messages,
        isLoadingChats,
        isLoadingMessages,
        typingUsers,
        drafts,
        replyingTo,
        editingMessage,
        setActiveChat,
        sendMessage,
        editMessage,
        deleteMessage,
        reactToMessage,
        pinMessage,
        starMessage,
        forwardMessage,
        setReplyingTo,
        setEditingMessage,
        setDraft,
        startTyping,
        stopTyping,
        createDirectChat,
        createGroupChat,
        clearChatHistory,
        toggleArchiveChat,
        togglePinChat,
        toggleMuteChat,
        refreshChats,
        starredMessageIds,
        incomingNotification,
        dismissNotification,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within a ChatProvider');
  return ctx;
};
