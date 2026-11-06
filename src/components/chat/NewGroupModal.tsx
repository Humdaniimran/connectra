import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useChat } from '../../context/ChatContext.tsx';
import { Avatar } from '../common/Avatar.tsx';
import { X, Users, Check, ShieldAlert } from 'lucide-react';

interface NewGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewGroupModal: React.FC<NewGroupModalProps> = ({ isOpen, onClose }) => {
  const { allUsers, currentUser } = useAuth();
  const { createGroupChat } = useChat();

  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const contacts = allUsers.filter((u) => u.id !== currentUser?.id);

  const toggleUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    setIsSubmitting(true);
    try {
      await createGroupChat(
        groupName.trim(),
        description.trim(),
        selectedUserIds
      );
      onClose();
    } catch (err) {
      console.error('Failed to create group:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3.5 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-cyan-400" />
            <span className="text-sm font-semibold text-white">New Group Conversation</span>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleCreate} className="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Group Name</label>
            <input
              type="text"
              placeholder="e.g. Mobile Engineering Team"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Description (Optional)</label>
            <textarea
              placeholder="Topic or guidelines for this group..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none"
            />
          </div>

          {/* Select Members */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-slate-400">
                Select Members ({selectedUserIds.length})
              </label>
              <span className="text-[10px] text-slate-500 font-mono">Max 256 members</span>
            </div>

            <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/60 p-2 divide-y divide-slate-800/40">
              {contacts.map((u) => {
                const isSelected = selectedUserIds.includes(u.id);
                return (
                  <div
                    key={u.id}
                    onClick={() => toggleUser(u.id)}
                    className="flex items-center justify-between p-2 hover:bg-slate-800/40 rounded-lg cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Avatar src={u.avatar} name={u.name} size="xs" status={u.status} showStatus />
                      <div>
                        <div className="text-xs font-medium text-slate-200">{u.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">@{u.username}</div>
                      </div>
                    </div>

                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded-md border transition-colors ${
                        isSelected
                          ? 'border-cyan-500 bg-cyan-600 text-white'
                          : 'border-slate-700 bg-slate-900'
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !groupName.trim()}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-cyan-600 py-3 text-xs font-bold text-white shadow-lg shadow-cyan-600/20 hover:bg-cyan-500 transition-colors disabled:opacity-50"
          >
            <Users className="h-4 w-4" />
            <span>{isSubmitting ? 'Creating Group...' : 'Create Group'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
