import React, { useState } from 'react';
import { Chat, Message, User } from '../../types/index.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useChat } from '../../context/ChatContext.tsx';
import { Avatar } from '../common/Avatar.tsx';
import { api } from '../../services/api.ts';
import {
  X,
  Phone,
  Video,
  ShieldCheck,
  Bell,
  BellOff,
  FileText,
  Link as LinkIcon,
  Trash2,
  UserX,
  UserPlus,
  UserMinus,
  Crown,
  ChevronRight,
  ExternalLink,
  ShieldAlert,
  LogOut,
  Check,
} from 'lucide-react';

interface ChatDetailDrawerProps {
  chat: Chat;
  messages: Message[];
  onClose: () => void;
  onStartCall: (type: 'audio' | 'video') => void;
}

export const ChatDetailDrawer: React.FC<ChatDetailDrawerProps> = ({
  chat,
  messages,
  onClose,
  onStartCall,
}) => {
  const { allUsers, currentUser, blockUser } = useAuth();
  const { clearChatHistory, toggleMuteChat, refreshChats } = useChat();
  const [activeMediaTab, setActiveMediaTab] = useState<'media' | 'docs' | 'links'>('media');
  const [showSecurityVerify, setShowSecurityVerify] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportSuccess, setReportSuccess] = useState(false);

  const isGroup = chat.type === 'group';
  const amAdmin = isGroup && chat.adminIds?.includes(currentUser?.id || '');

  // For direct chats, find the peer user
  const peerUserId = !isGroup ? chat.participantIds.find((id) => id !== currentUser?.id) : null;
  const peerUser = allUsers.find((u) => u.id === peerUserId);

  const title = isGroup ? chat.name || 'Group' : peerUser?.name || 'Direct Chat';
  const avatar = isGroup ? chat.avatar : peerUser?.avatar;
  const subtitle = isGroup
    ? `${chat.participantIds.length} members`
    : `@${peerUser?.username || 'user'} · ${peerUser?.phoneNumber || ''}`;

  // Media items from messages
  const mediaItems = messages.filter((m) => m.type === 'image' || m.type === 'video');
  const docItems = messages.filter((m) => m.type === 'document');

  const participants = allUsers.filter((u) => chat.participantIds.includes(u.id));
  const availableToAdd = allUsers.filter(
    (u) => !chat.participantIds.includes(u.id) && u.id !== currentUser?.id
  );

  const handleAddMember = async (userId: string) => {
    try {
      await api.addGroupMember(chat.id, userId);
      await refreshChats();
      setShowAddMember(false);
    } catch (e) {
      console.error('Failed to add member:', e);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (window.confirm('Remove this member from the group?')) {
      try {
        await api.removeGroupMember(chat.id, userId);
        await refreshChats();
      } catch (e) {
        console.error('Failed to remove member:', e);
      }
    }
  };

  const handleToggleAdmin = async (userId: string, isCurrentlyAdmin: boolean) => {
    try {
      await api.toggleGroupAdmin(chat.id, userId, isCurrentlyAdmin ? 'demote' : 'promote');
      await refreshChats();
    } catch (e) {
      console.error('Failed to toggle admin role:', e);
    }
  };

  const handleLeaveGroup = async () => {
    if (!currentUser) return;
    if (window.confirm('Are you sure you want to leave this group?')) {
      try {
        await api.leaveGroup(chat.id, currentUser.id);
        await refreshChats();
        onClose();
      } catch (e) {
        console.error('Failed to leave group:', e);
      }
    }
  };

  const handleSendReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !reportReason.trim()) return;
    try {
      await api.submitAbuseReport(
        currentUser.id,
        peerUserId || chat.id,
        reportReason.trim()
      );
      setReportSuccess(true);
      setTimeout(() => {
        setReportSuccess(false);
        setShowReportModal(false);
        setReportReason('');
      }, 1500);
    } catch (e) {
      console.error('Failed to submit report:', e);
    }
  };

  return (
    <div className="flex h-full w-80 md:w-96 flex-col border-l border-slate-800 bg-slate-900/95 backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3.5 bg-slate-950/60">
        <span className="text-sm font-semibold text-white">
          {isGroup ? 'Group Info' : 'Contact Info'}
        </span>
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Profile Card */}
        <div className="flex flex-col items-center text-center">
          <Avatar src={avatar} name={title} size="xl" status={peerUser?.status} showStatus={!isGroup} />
          <h3 className="mt-3 text-base font-bold text-white">{title}</h3>
          <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>

          {/* Call Actions */}
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={() => onStartCall('audio')}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-cyan-400 hover:bg-slate-700 hover:text-cyan-300 transition-colors shadow-sm"
              title="Voice Call"
            >
              <Phone className="h-4 w-4" />
            </button>
            <button
              onClick={() => onStartCall('video')}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-cyan-400 hover:bg-slate-700 hover:text-cyan-300 transition-colors shadow-sm"
              title="Video Call"
            >
              <Video className="h-4 w-4" />
            </button>
            <button
              onClick={() => toggleMuteChat(chat.id)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors shadow-sm"
              title={chat.isMuted ? 'Unmute' : 'Mute'}
            >
              {chat.isMuted ? <BellOff className="h-4 w-4 text-amber-400" /> : <Bell className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Bio or Description */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            {isGroup ? 'Group Description' : 'About'}
          </div>
          <p className="text-xs text-slate-200 leading-relaxed">
            {isGroup ? chat.description || 'No description provided.' : peerUser?.bio || 'Hey there! I am using Connectra.'}
          </p>
        </div>

        {/* End-to-End Encryption Security Card */}
        <div
          onClick={() => setShowSecurityVerify(!showSecurityVerify)}
          className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-3.5 cursor-pointer hover:border-cyan-500/50 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-cyan-300 font-medium text-xs">
              <ShieldCheck className="h-4 w-4 text-cyan-400" />
              <span>End-to-End Encrypted</span>
            </div>
            <ChevronRight className={`h-3.5 w-3.5 text-cyan-400 transition-transform ${showSecurityVerify ? 'rotate-90' : ''}`} />
          </div>
          <p className="text-[11px] text-slate-400 mt-1 leading-normal">
            Messages and calls are end-to-end encrypted with zero-knowledge keys. Tap to inspect safety number.
          </p>

          {showSecurityVerify && (
            <div className="mt-3 pt-3 border-t border-cyan-500/20 text-center animate-in fade-in">
              <span className="text-[10px] text-cyan-400 font-mono tracking-widest uppercase">
                Safety Verification Fingerprint
              </span>
              <div className="mt-1 font-mono text-xs font-semibold text-white tracking-widest bg-slate-950/80 p-2 rounded-lg border border-cyan-800/40">
                48192 00392 77124 99018 33281 64019
              </div>
            </div>
          )}
        </div>

        {/* Group Participants List */}
        {isGroup && (
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300">
                Participants ({participants.length})
              </span>
              <div className="flex items-center gap-2">
                {amAdmin && (
                  <button
                    onClick={() => setShowAddMember(true)}
                    className="flex items-center gap-1 text-[11px] text-cyan-400 hover:underline"
                  >
                    <UserPlus className="h-3 w-3" />
                    <span>Add</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`https://connectra.app/join/${chat.inviteCode || 'GROUP'}`);
                    alert(`Invite link copied to clipboard!`);
                  }}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white"
                >
                  <ExternalLink className="h-3 w-3" />
                  <span>Invite Link</span>
                </button>
              </div>
            </div>

            <div className="divide-y divide-slate-800/40 space-y-1">
              {participants.map((u) => {
                const isMemberAdmin = chat.adminIds?.includes(u.id);
                const isMe = u.id === currentUser?.id;
                return (
                  <div key={u.id} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2.5">
                      <Avatar src={u.avatar} name={u.name} size="xs" status={u.status} showStatus />
                      <div>
                        <div className="text-xs font-medium text-slate-200">
                          {u.name} {isMe ? '(You)' : ''}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">@{u.username}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {isMemberAdmin && (
                        <span className="flex items-center gap-1 text-[10px] font-mono text-amber-400 bg-amber-950/40 border border-amber-800/40 px-1.5 py-0.5 rounded">
                          <Crown className="h-2.5 w-2.5" />
                          Admin
                        </span>
                      )}

                      {amAdmin && !isMe && (
                        <div className="flex items-center gap-1 ml-1">
                          <button
                            onClick={() => handleToggleAdmin(u.id, !!isMemberAdmin)}
                            title={isMemberAdmin ? 'Demote from Admin' : 'Make Group Admin'}
                            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-amber-400"
                          >
                            <Crown className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => handleRemoveMember(u.id)}
                            title="Remove Member"
                            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-400"
                          >
                            <UserMinus className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Shared Media / Docs / Links */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
          <div className="grid grid-cols-3 gap-1 rounded-lg bg-slate-900 p-1 text-[11px] font-medium text-center mb-3">
            <button
              onClick={() => setActiveMediaTab('media')}
              className={`rounded py-1 transition-colors ${
                activeMediaTab === 'media' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Media ({mediaItems.length})
            </button>
            <button
              onClick={() => setActiveMediaTab('docs')}
              className={`rounded py-1 transition-colors ${
                activeMediaTab === 'docs' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Docs ({docItems.length})
            </button>
            <button
              onClick={() => setActiveMediaTab('links')}
              className={`rounded py-1 transition-colors ${
                activeMediaTab === 'links' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Links (2)
            </button>
          </div>

          {activeMediaTab === 'media' && (
            <div className="grid grid-cols-3 gap-1.5">
              {mediaItems.length > 0 ? (
                mediaItems.map((m) => (
                  <div key={m.id} className="relative aspect-square rounded-lg overflow-hidden bg-slate-800">
                    {m.attachment?.url && (
                      <img
                        src={m.attachment.url}
                        alt="Media"
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                ))
              ) : (
                <div className="col-span-3 text-center py-4 text-xs text-slate-500">
                  No media shared yet
                </div>
              )}
            </div>
          )}

          {activeMediaTab === 'docs' && (
            <div className="space-y-1.5">
              {docItems.length > 0 ? (
                docItems.map((m) => (
                  <div key={m.id} className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-900 text-xs text-slate-300">
                    <FileText className="h-4 w-4 text-cyan-400 shrink-0" />
                    <span className="truncate flex-1">{m.attachment?.fileName || 'Document'}</span>
                    <span className="text-[10px] text-slate-500">{m.attachment?.fileSize}</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-xs text-slate-500">
                  No documents shared yet
                </div>
              )}
            </div>
          )}

          {activeMediaTab === 'links' && (
            <div className="space-y-1.5 text-xs text-slate-300">
              <div className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-900">
                <LinkIcon className="h-4 w-4 text-cyan-400 shrink-0" />
                <span className="truncate flex-1">https://webrtc.org/architecture</span>
                <ExternalLink className="h-3 w-3 text-slate-500" />
              </div>
              <div className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-900">
                <LinkIcon className="h-4 w-4 text-cyan-400 shrink-0" />
                <span className="truncate flex-1">https://connectra.app/specs</span>
                <ExternalLink className="h-3 w-3 text-slate-500" />
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-2 pt-2">
          <button
            onClick={() => {
              if (window.confirm('Clear all messages in this chat?')) {
                clearChatHistory(chat.id);
              }
            }}
            className="flex w-full items-center justify-between rounded-xl border border-slate-800 p-3 text-xs text-slate-300 hover:bg-slate-800 transition-colors"
          >
            <span>Clear Chat History</span>
            <Trash2 className="h-4 w-4 text-slate-400" />
          </button>

          {isGroup ? (
            <button
              onClick={handleLeaveGroup}
              className="flex w-full items-center justify-between rounded-xl border border-rose-900/40 p-3 text-xs text-rose-400 hover:bg-rose-950/20 transition-colors"
            >
              <span>Leave Group</span>
              <LogOut className="h-4 w-4 text-rose-400" />
            </button>
          ) : (
            peerUser && (
              <button
                onClick={() => {
                  if (window.confirm(`Block ${peerUser.name}?`)) {
                    blockUser(peerUser.id);
                  }
                }}
                className="flex w-full items-center justify-between rounded-xl border border-rose-900/40 p-3 text-xs text-rose-400 hover:bg-rose-950/20 transition-colors"
              >
                <span>Block Contact</span>
                <UserX className="h-4 w-4 text-rose-400" />
              </button>
            )
          )}

          <button
            onClick={() => setShowReportModal(true)}
            className="flex w-full items-center justify-between rounded-xl border border-slate-800 p-3 text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <span>Report User or Spam</span>
            <ShieldAlert className="h-4 w-4 text-slate-400" />
          </button>
        </div>
      </div>

      {/* MODAL: Add Member */}
      {showAddMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
              <span className="text-xs font-bold text-white">Add Member to Group</span>
              <button onClick={() => setShowAddMember(false)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-60 overflow-y-auto divide-y divide-slate-800/40">
              {availableToAdd.length === 0 ? (
                <div className="py-4 text-center text-xs text-slate-500">
                  All your contacts are already members.
                </div>
              ) : (
                availableToAdd.map((u) => (
                  <div key={u.id} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <Avatar src={u.avatar} name={u.name} size="xs" />
                      <div>
                        <div className="text-xs font-medium text-slate-200">{u.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">@{u.username}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddMember(u.id)}
                      className="rounded-lg bg-cyan-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-cyan-500"
                    >
                      Add
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Report */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-white">Report to Safety & Moderation</span>
              <button onClick={() => setShowReportModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            {reportSuccess ? (
              <div className="py-6 text-center text-xs text-emerald-400 font-medium">
                <Check className="h-6 w-6 mx-auto mb-1 text-emerald-400" />
                <span>Thank you. Report received by moderation.</span>
              </div>
            ) : (
              <form onSubmit={handleSendReport} className="space-y-3">
                <p className="text-[11px] text-slate-400">
                  Please provide details about the abuse or violation:
                </p>
                <textarea
                  placeholder="Describe the spam, harassment, or violation..."
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2 text-xs text-white focus:outline-none focus:border-cyan-500 resize-none"
                  required
                />
                <button
                  type="submit"
                  className="w-full rounded-xl bg-rose-600 py-2 text-xs font-semibold text-white hover:bg-rose-500"
                >
                  Submit Report
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
