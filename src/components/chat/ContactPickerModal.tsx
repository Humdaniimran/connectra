import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { Avatar } from '../common/Avatar.tsx';
import { User } from '../../types/index.ts';
import { Search, UserCheck, X } from 'lucide-react';

interface ContactPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectContact: (contact: { name: string; phoneNumber: string }) => void;
}

export const ContactPickerModal: React.FC<ContactPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectContact,
}) => {
  const { allUsers, currentUser } = useAuth();
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const contacts = allUsers.filter(
    (u) =>
      u.id !== currentUser?.id &&
      (u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.phoneNumber.includes(search))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3.5 bg-slate-950/60">
          <div className="text-white font-medium text-sm">Share Contact</div>
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
              placeholder="Search contacts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div className="max-h-72 overflow-y-auto p-2 divide-y divide-slate-800/40">
          {contacts.map((u) => (
            <button
              key={u.id}
              onClick={() => {
                onSelectContact({ name: u.name, phoneNumber: u.phoneNumber });
                onClose();
              }}
              className="flex w-full items-center justify-between p-2.5 hover:bg-slate-800/60 rounded-xl transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <Avatar src={u.avatar} name={u.name} size="sm" />
                <div>
                  <div className="text-xs font-medium text-slate-200">{u.name}</div>
                  <div className="text-[11px] text-slate-400 font-mono">{u.phoneNumber}</div>
                </div>
              </div>
              <UserCheck className="h-4 w-4 text-cyan-400" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
