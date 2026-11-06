import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useChat } from '../../context/ChatContext.tsx';
import { useCall } from '../../context/CallContext.tsx';
import { Avatar } from '../common/Avatar.tsx';
import { User } from '../../types/index.ts';
import {
  Search,
  MessageSquare,
  Phone,
  Video,
  X,
  Share2,
  Check,
  UserPlus,
} from 'lucide-react';

interface ContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ContactsModal: React.FC<ContactsModalProps> = ({ isOpen, onClose }) => {
  const { allUsers, currentUser } = useAuth();
  const { createDirectChat } = useChat();
  const { startCall } = useCall();

  const [search, setSearch] = useState('');
  const [copiedInvite, setCopiedInvite] = useState(false);

  if (!isOpen) return null;

  const contacts = allUsers.filter(
    (u) =>
      u.id !== currentUser?.id &&
      (u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.phoneNumber.includes(search) ||
        u.username.toLowerCase().includes(search.toLowerCase()))
  );

  const handleStartChat = async (user: User) => {
    await createDirectChat(user.id);
    onClose();
  };

  const handleCopyInvite = () => {
    navigator.clipboard.writeText('https://connectra.app/download?ref=connectra_friend');
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3.5 bg-slate-950/60">
          <span className="text-sm font-semibold text-white">Contacts ({contacts.length})</span>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-slate-800 bg-slate-950/40">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, @username, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Invite link card */}
        <div className="p-3 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-600/20 text-cyan-400">
              <Share2 className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-white">Invite Friends</div>
              <div className="text-[10px] text-slate-400">Share your invite link</div>
            </div>
          </div>
          <button
            onClick={handleCopyInvite}
            className="flex items-center gap-1 rounded-lg bg-cyan-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-cyan-500 shadow-sm"
          >
            {copiedInvite ? <Check className="h-3 w-3" /> : <UserPlus className="h-3 w-3" />}
            <span>{copiedInvite ? 'Copied' : 'Share Link'}</span>
          </button>
        </div>

        {/* Contacts list */}
        <div className="flex-1 overflow-y-auto p-2 divide-y divide-slate-800/40">
          {contacts.map((u) => (
            <div
              key={u.id}
              className="flex items-center justify-between p-2.5 hover:bg-slate-800/40 rounded-xl transition-colors"
            >
              <div
                className="flex items-center gap-3 cursor-pointer flex-1"
                onClick={() => handleStartChat(u)}
              >
                <Avatar src={u.avatar} name={u.name} size="md" status={u.status} showStatus />
                <div>
                  <div className="text-xs font-semibold text-slate-100">{u.name}</div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    @{u.username} · {u.phoneNumber}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleStartChat(u)}
                  title="Direct Message"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-cyan-400"
                >
                  <MessageSquare className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    onClose();
                    startCall(u, 'audio');
                  }}
                  title="Voice Call"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-cyan-400"
                >
                  <Phone className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    onClose();
                    startCall(u, 'video');
                  }}
                  title="Video Call"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-cyan-400"
                >
                  <Video className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
