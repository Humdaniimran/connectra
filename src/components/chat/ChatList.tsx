import React, { useState } from 'react';
import { useChat } from '../../context/ChatContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { Avatar } from '../common/Avatar.tsx';
import { Chat } from '../../types/index.ts';
import {
  Search,
  Pin,
  Check,
  CheckCheck,
  Users,
  MessageSquarePlus,
  BellOff,
  Archive,
  X,
} from 'lucide-react';

interface ChatListProps {
  onOpenNewChat: () => void;
  onOpenNewGroup: () => void;
}

export const ChatList: React.FC<ChatListProps> = ({
  onOpenNewChat,
  onOpenNewGroup,
}) => {
  const { chats, activeChat, setActiveChat, togglePinChat, toggleArchiveChat } = useChat();
  const { allUsers, currentUser } = useAuth();

  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'unread' | 'groups' | 'archived'>('all');

  const getChatTitle = (c: Chat) => {
    if (c.type === 'group') return c.name || 'Group';
    const otherId = c.participantIds.find((id) => id !== currentUser?.id);
    const otherUser = allUsers.find((u) => u.id === otherId);
    return otherUser?.name || 'Direct Chat';
  };

  const getChatAvatar = (c: Chat) => {
    if (c.type === 'group') return c.avatar;
    const otherId = c.participantIds.find((id) => id !== currentUser?.id);
    const otherUser = allUsers.find((u) => u.id === otherId);
    return otherUser?.avatar;
  };

  const getPeerUser = (c: Chat) => {
    if (c.type === 'group') return null;
    const otherId = c.participantIds.find((id) => id !== currentUser?.id);
    return allUsers.find((u) => u.id === otherId);
  };

  const formatTimestamp = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      const now = new Date();
      if (d.toDateString() === now.toDateString()) {
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  // Filter list
  const filteredChats = chats.filter((c) => {
    // Tab filter
    if (filterTab === 'archived') {
      if (!c.isArchived) return false;
    } else {
      if (c.isArchived) return false;
      if (filterTab === 'unread' && (!c.unreadCount || c.unreadCount === 0)) return false;
      if (filterTab === 'groups' && c.type !== 'group') return false;
    }

    // Search query
    if (search.trim()) {
      const title = getChatTitle(c).toLowerCase();
      const lastContent = c.lastMessage?.content.toLowerCase() || '';
      return title.includes(search.toLowerCase()) || lastContent.includes(search.toLowerCase());
    }

    return true;
  });

  return (
    <div className="flex h-full w-full flex-col border-r border-slate-800 bg-slate-900/90 backdrop-blur-md">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between border-b border-slate-800/80 px-4 py-3 bg-slate-950/60">
        <h2 className="text-base font-bold text-white tracking-tight">Chats</h2>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenNewGroup}
            title="New Group Chat"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-cyan-400 transition-colors"
          >
            <Users className="h-4 w-4" />
          </button>
          <button
            onClick={onOpenNewChat}
            title="New Direct Message"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-600 text-white hover:bg-cyan-500 shadow-sm transition-colors"
          >
            <MessageSquarePlus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="p-3 border-b border-slate-800/60">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-8 pr-7 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filter Segmented Controls */}
        <div className="mt-2.5 flex items-center gap-1">
          <button
            onClick={() => setFilterTab('all')}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
              filterTab === 'all'
                ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterTab('unread')}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
              filterTab === 'unread'
                ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Unread
          </button>
          <button
            onClick={() => setFilterTab('groups')}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
              filterTab === 'groups'
                ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Groups
          </button>
          <button
            onClick={() => setFilterTab('archived')}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
              filterTab === 'archived'
                ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Archived
          </button>
        </div>
      </div>

      {/* Chat Rows */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40 p-1.5">
        {filteredChats.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No conversations match your filter.
          </div>
        ) : (
          filteredChats.map((c) => {
            const isSelected = activeChat?.id === c.id;
            const peer = getPeerUser(c);
            const title = getChatTitle(c);
            const avatar = getChatAvatar(c);
            const isMeLastSender = c.lastMessage?.senderId === currentUser?.id;

            return (
              <div
                key={c.id}
                onClick={() => setActiveChat(c)}
                className={`group flex items-center justify-between rounded-xl p-2.5 cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-cyan-950/30 border border-cyan-500/30'
                    : 'hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Avatar
                    src={avatar}
                    name={title}
                    size="md"
                    status={peer?.status}
                    showStatus={c.type === 'direct'}
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="truncate text-xs font-semibold text-slate-100">
                        {title}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono tabular-nums shrink-0 ml-1">
                        {formatTimestamp(c.lastMessage?.createdAt || c.createdAt)}
                      </span>
                    </div>

                    <div className="mt-0.5 flex items-center justify-between">
                      <p className="truncate text-xs text-slate-400 flex items-center gap-1">
                        {isMeLastSender && (
                          <span className="shrink-0 text-slate-400">
                            {c.lastMessage?.status === 'read' ? (
                              <CheckCheck className="h-3 w-3 text-cyan-400" />
                            ) : c.lastMessage?.status === 'delivered' ? (
                              <CheckCheck className="h-3 w-3" />
                            ) : (
                              <Check className="h-3 w-3" />
                            )}
                          </span>
                        )}
                        <span className="truncate">
                          {c.lastMessage?.type === 'audio'
                            ? '🎤 Voice note'
                            : c.lastMessage?.type === 'image'
                            ? '📷 Photo'
                            : c.lastMessage?.type === 'video'
                            ? '🎥 Video'
                            : c.lastMessage?.type === 'document'
                            ? '📄 Document'
                            : c.lastMessage?.type === 'location'
                            ? '📍 Location'
                            : c.lastMessage?.content || 'No messages yet'}
                        </span>
                      </p>

                      <div className="flex items-center gap-1.5 shrink-0 ml-1">
                        {c.isPinned && (
                          <Pin className="h-3 w-3 text-cyan-400" />
                        )}
                        {c.isMuted && (
                          <BellOff className="h-3 w-3 text-slate-500" />
                        )}
                        {c.unreadCount && c.unreadCount > 0 ? (
                          <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-cyan-500 px-1 text-[10px] font-bold text-slate-950 font-mono tabular-nums">
                            {c.unreadCount}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
