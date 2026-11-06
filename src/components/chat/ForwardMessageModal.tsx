import React, { useState } from 'react';
import { useChat } from '../../context/ChatContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { Avatar } from '../common/Avatar.tsx';
import { Message } from '../../types/index.ts';
import { Search, Forward, X } from 'lucide-react';

interface ForwardMessageModalProps {
  message: Message | null;
  onClose: () => void;
}

export const ForwardMessageModal: React.FC<ForwardMessageModalProps> = ({
  message,
  onClose,
}) => {
  const { chats, forwardMessage } = useChat();
  const { allUsers, currentUser } = useAuth();
  const [search, setSearch] = useState('');

  if (!message) return null;

  const getChatTitle = (c: typeof chats[0]) => {
    if (c.type === 'group') return c.name || 'Group';
    const otherId = c.participantIds.find((id) => id !== currentUser?.id);
    const otherUser = allUsers.find((u) => u.id === otherId);
    return otherUser?.name || 'Direct Chat';
  };

  const getChatAvatar = (c: typeof chats[0]) => {
    if (c.type === 'group') return c.avatar;
    const otherId = c.participantIds.find((id) => id !== currentUser?.id);
    const otherUser = allUsers.find((u) => u.id === otherId);
    return otherUser?.avatar;
  };

  const filtered = chats.filter((c) =>
    getChatTitle(c).toLowerCase().includes(search.toLowerCase())
  );

  const handleForwardTo = async (chatId: string) => {
    await forwardMessage(chatId, message);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3.5 bg-slate-950/60">
          <div className="flex items-center gap-2 text-white font-medium text-sm">
            <Forward className="h-4 w-4 text-cyan-400" />
            <span>Forward Message</span>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-3 border-b border-slate-800">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div className="max-h-72 overflow-y-auto p-2 divide-y divide-slate-800/40">
          {filtered.map((c) => (
            <button
              key={c.id}
              onClick={() => handleForwardTo(c.id)}
              className="flex w-full items-center justify-between p-2.5 hover:bg-slate-800/60 rounded-xl transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <Avatar src={getChatAvatar(c)} name={getChatTitle(c)} size="sm" />
                <div>
                  <div className="text-xs font-medium text-slate-200">{getChatTitle(c)}</div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">{c.type}</div>
                </div>
              </div>
              <Forward className="h-4 w-4 text-slate-400" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
