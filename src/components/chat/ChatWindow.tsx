import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../../context/ChatContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { useCall } from '../../context/CallContext.tsx';
import { Avatar } from '../common/Avatar.tsx';
import { MessageBubble } from './MessageBubble.tsx';
import { VoiceRecorder } from './VoiceRecorder.tsx';
import { LocationPickerModal } from './LocationPickerModal.tsx';
import { ContactPickerModal } from './ContactPickerModal.tsx';
import { ForwardMessageModal } from './ForwardMessageModal.tsx';
import { ChatDetailDrawer } from './ChatDetailDrawer.tsx';
import { Message } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import {
  ArrowLeft,
  Phone,
  Video,
  Search,
  MoreVertical,
  Paperclip,
  Smile,
  Mic,
  Send,
  Pin,
  X,
  Image as ImageIcon,
  FileText,
  MapPin,
  User as UserIcon,
  Film,
  Lock,
} from 'lucide-react';

export const ChatWindow: React.FC = () => {
  const {
    activeChat,
    messages,
    isLoadingMessages,
    sendMessage,
    editMessage,
    replyingTo,
    setReplyingTo,
    editingMessage,
    setEditingMessage,
    drafts,
    setDraft,
    startTyping,
    stopTyping,
    typingUsers,
    setActiveChat,
  } = useChat();

  const { currentUser, allUsers } = useAuth();
  const { startCall, startGroupCall } = useCall();

  // Local state
  const [inputText, setInputText] = useState('');
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  const [forwardingMessage, setForwardingMessage] = useState<Message | null>(null);

  // Modals for attachments
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showContactPicker, setShowContactPicker] = useState(false);

  // Search within chat
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [fileTypeToUpload, setFileTypeToUpload] = useState<'image' | 'video' | 'document'>('image');

  // Load draft text when switching chats
  useEffect(() => {
    if (activeChat) {
      setInputText(drafts[activeChat.id] || '');
    }
  }, [activeChat?.id]);

  // Handle draft saving on unmount / change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputText(val);
    if (activeChat) {
      setDraft(activeChat.id, val);
    }
    if (val.trim()) {
      startTyping();
    } else {
      stopTyping();
    }
  };

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  if (!activeChat) {
    return (
      <div className="flex h-full flex-1 flex-col items-center justify-center bg-slate-950 p-6 text-center select-none">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400 mb-4 border border-cyan-500/20">
          <Lock className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-bold text-white">Connectra Secure Messaging</h3>
        <p className="mt-1 max-w-sm text-xs text-slate-400">
          Select a conversation from the sidebar or start a new chat to begin end-to-end encrypted messaging and HD calling.
        </p>
      </div>
    );
  }

  const isGroup = activeChat.type === 'group';
  const peerUserId = !isGroup ? activeChat.participantIds.find((id) => id !== currentUser?.id) : null;
  const peerUser = allUsers.find((u) => u.id === peerUserId);

  const title = isGroup ? activeChat.name || 'Group' : peerUser?.name || 'Direct Chat';
  const avatar = isGroup ? activeChat.avatar : peerUser?.avatar;

  // Typing status for this chat
  const chatTyping = (typingUsers[activeChat.id] || []).filter(
    (name) => name !== currentUser?.name
  );

  // Status subtitle
  const getSubtitle = () => {
    if (chatTyping.length > 0) {
      return `${chatTyping.join(', ')} is typing...`;
    }
    if (isGroup) {
      return `${activeChat.participantIds.length} members`;
    }
    if (peerUser?.status === 'online') {
      return 'Online';
    }
    if (peerUser?.lastSeen) {
      try {
        const d = new Date(peerUser.lastSeen);
        return `Last seen ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      } catch {
        return 'Offline';
      }
    }
    return 'Offline';
  };

  // Send text message or complete edit
  const handleSend = () => {
    const trimmed = inputText.trim();
    if (!trimmed) return;

    if (editingMessage) {
      editMessage(editingMessage.id, trimmed);
      setEditingMessage(null);
    } else {
      sendMessage(trimmed, 'text');
    }
    setInputText('');
    setShowEmojiPicker(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  // Trigger file upload dialog
  const triggerFileUpload = (type: 'image' | 'video' | 'document') => {
    setFileTypeToUpload(type);
    setShowAttachmentMenu(false);
    if (fileInputRef.current) {
      if (type === 'image') fileInputRef.current.accept = 'image/*';
      else if (type === 'video') fileInputRef.current.accept = 'video/*';
      else fileInputRef.current.accept = '.pdf,.doc,.docx,.txt,.zip';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const dataUrl = reader.result as string;
      const sizeStr = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

      const uploadRes = await api.uploadMedia(dataUrl, file.name, file.type, sizeStr);
      sendMessage(
        '',
        fileTypeToUpload,
        {
          type: fileTypeToUpload,
          url: uploadRes.url,
          fileName: file.name,
          fileSize: sizeStr,
        }
      );
    };
    reader.readAsDataURL(file);
    // Reset file input
    e.target.value = '';
  };

  // Send voice note
  const handleSendVoiceAudio = (audioDataUrl: string, durationSeconds: number) => {
    sendMessage(
      '',
      'audio',
      {
        type: 'audio',
        url: audioDataUrl,
        fileName: 'Voice note',
        duration: durationSeconds,
        fileSize: `${Math.round(durationSeconds * 9.5)} KB`,
      }
    );
    setIsRecordingVoice(false);
  };

  // Start call
  const handleStartCall = (type: 'audio' | 'video') => {
    if (isGroup) {
      startGroupCall(activeChat.id, title);
    } else if (peerUser) {
      startCall(peerUser, type, activeChat.id);
    }
  };

  // Pinned message
  const pinnedMessage = messages.find((m) => m.isPinned);

  // Filter messages if search is active
  const filteredMessages = searchQuery.trim()
    ? messages.filter((m) => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  return (
    <div className="flex h-full flex-1 overflow-hidden bg-slate-950">
      <div className="flex flex-1 flex-col h-full overflow-hidden">
        {/* CHAT HEADER */}
        <div className="flex h-16 items-center justify-between border-b border-slate-800/80 bg-slate-900/80 px-4 backdrop-blur-md z-10">
          <div className="flex items-center gap-3 min-w-0">
            {/* Back button on mobile */}
            <button
              onClick={() => setActiveChat(null)}
              className="lg:hidden flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <div
              className="flex items-center gap-3 cursor-pointer min-w-0"
              onClick={() => setShowDetailDrawer(!showDetailDrawer)}
            >
              <Avatar
                src={avatar}
                name={title}
                size="md"
                status={peerUser?.status}
                showStatus={!isGroup}
              />
              <div className="min-w-0">
                <div className="truncate text-sm font-bold text-white flex items-center gap-1.5">
                  <span>{title}</span>
                  {activeChat.isMuted && (
                    <span className="text-[10px] text-slate-500">🔇</span>
                  )}
                </div>
                <div
                  className={`truncate text-xs ${
                    chatTyping.length > 0 ? 'text-cyan-400 font-medium animate-pulse' : 'text-slate-400'
                  }`}
                >
                  {getSubtitle()}
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleStartCall('audio')}
              title={isGroup ? 'Start Group Voice Call' : 'Start Audio Call'}
              className="flex h-9 w-9 items-center justify-center rounded-full text-cyan-400 hover:bg-cyan-500/10 transition-colors"
            >
              <Phone className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleStartCall('video')}
              title={isGroup ? 'Start Group Video Call' : 'Start Video Call'}
              className="flex h-9 w-9 items-center justify-center rounded-full text-cyan-400 hover:bg-cyan-500/10 transition-colors"
            >
              <Video className="h-4 w-4" />
            </button>
            <button
              onClick={() => setShowSearch(!showSearch)}
              title="Search messages"
              className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <Search className="h-4 w-4" />
            </button>
            <button
              onClick={() => setShowDetailDrawer(!showDetailDrawer)}
              title="Chat Info"
              className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* SEARCH BAR (in-chat) */}
        {showSearch && (
          <div className="flex items-center gap-2 border-b border-slate-800 bg-slate-900/90 px-4 py-2 text-xs">
            <Search className="h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search in this conversation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-white placeholder-slate-500 focus:outline-none"
              autoFocus
            />
            {searchQuery && (
              <span className="text-[10px] text-slate-400 font-mono">
                {filteredMessages.length} found
              </span>
            )}
            <button
              onClick={() => {
                setShowSearch(false);
                setSearchQuery('');
              }}
              className="text-slate-400 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* PINNED MESSAGE BANNER */}
        {pinnedMessage && (
          <div className="flex items-center justify-between border-b border-cyan-500/20 bg-cyan-950/30 px-4 py-2 text-xs text-cyan-200">
            <div className="flex items-center gap-2 truncate">
              <Pin className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
              <span className="font-semibold text-cyan-300">Pinned:</span>
              <span className="truncate">{pinnedMessage.content || 'Attachment'}</span>
            </div>
            <button
              onClick={() => {
                // Scroll to pinned message
                const el = document.getElementById(pinnedMessage.id);
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-[11px] text-cyan-400 hover:underline shrink-0 ml-2"
            >
              View
            </button>
          </div>
        )}

        {/* MESSAGES STREAM */}
        <div
          className="flex-1 overflow-y-auto px-4 py-3 space-y-2 relative"
          style={{
            backgroundImage: 'radial-gradient(rgba(14, 165, 233, 0.03) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        >
          {/* E2EE Info Badge */}
          <div className="mx-auto max-w-sm rounded-xl border border-cyan-500/20 bg-cyan-950/20 p-2 text-center text-[11px] text-cyan-300/80 mb-4 shadow-sm flex items-center justify-center gap-1.5">
            <Lock className="h-3 w-3 text-cyan-400" />
            <span>Messages are end-to-end encrypted with zero-knowledge keys.</span>
          </div>

          {isLoadingMessages ? (
            <div className="flex justify-center py-8 text-xs text-slate-500">
              Decrypting messages...
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500 text-xs">
              <span>No messages found.</span>
              <span className="text-[11px] text-slate-600 mt-1">Say hello to get started! 👋</span>
            </div>
          ) : (
            filteredMessages.map((msg, idx) => {
              const sender = allUsers.find((u) => u.id === msg.senderId);
              return (
                <div key={msg.id} id={msg.id}>
                  <MessageBubble
                    message={msg}
                    sender={sender}
                    isGroup={isGroup}
                    onOpenForward={(m) => setForwardingMessage(m)}
                  />
                </div>
              );
            })
          )}

          {/* Typing Indicator Bubble */}
          {chatTyping.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-slate-400 py-1 px-3 bg-slate-900/60 rounded-full w-fit">
              <span className="flex gap-1 items-center">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-bounce" />
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.2s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.4s]" />
              </span>
              <span>{chatTyping.join(', ')} is typing...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* REPLY PREVIEW BAR */}
        {replyingTo && (
          <div className="flex items-center justify-between border-t border-slate-800 bg-slate-900 px-4 py-2 text-xs">
            <div className="border-l-2 border-cyan-400 pl-2">
              <div className="font-semibold text-cyan-400">
                Replying to {allUsers.find((u) => u.id === replyingTo.senderId)?.name || 'User'}
              </div>
              <div className="line-clamp-1 text-slate-400 text-[11px]">
                {replyingTo.content || 'Attachment'}
              </div>
            </div>
            <button
              onClick={() => setReplyingTo(null)}
              className="text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* EDITING MESSAGE BAR */}
        {editingMessage && (
          <div className="flex items-center justify-between border-t border-cyan-800/40 bg-cyan-950/30 px-4 py-2 text-xs">
            <div className="border-l-2 border-cyan-400 pl-2">
              <div className="font-semibold text-cyan-300">Editing Message</div>
              <div className="line-clamp-1 text-slate-300 text-[11px]">
                {editingMessage.content}
              </div>
            </div>
            <button
              onClick={() => {
                setEditingMessage(null);
                setInputText('');
              }}
              className="text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* INPUT AREA */}
        <div className="relative border-t border-slate-800/80 bg-slate-900/90 p-3 backdrop-blur-md">
          {isRecordingVoice ? (
            <VoiceRecorder
              onSendAudio={handleSendVoiceAudio}
              onCancel={() => setIsRecordingVoice(false)}
            />
          ) : (
            <div className="flex items-center gap-2">
              {/* Attachment Button */}
              <div className="relative">
                <button
                  onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                  title="Share media, docs, location"
                  className="flex h-10 w-10 items-center justify-center rounded-full text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                >
                  <Paperclip className="h-5 w-5" />
                </button>

                {/* Attachment Menu Popup */}
                {showAttachmentMenu && (
                  <div className="absolute bottom-12 left-0 z-30 w-48 rounded-2xl border border-slate-800 bg-slate-900 p-2 shadow-2xl space-y-1 animate-in slide-in-from-bottom duration-150">
                    <button
                      onClick={() => triggerFileUpload('image')}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 transition-colors"
                    >
                      <ImageIcon className="h-4 w-4 text-emerald-400" />
                      <span>Photos & Images</span>
                    </button>
                    <button
                      onClick={() => triggerFileUpload('video')}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 transition-colors"
                    >
                      <Film className="h-4 w-4 text-rose-400" />
                      <span>Video Recording</span>
                    </button>
                    <button
                      onClick={() => triggerFileUpload('document')}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 transition-colors"
                    >
                      <FileText className="h-4 w-4 text-blue-400" />
                      <span>Document / PDF</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowAttachmentMenu(false);
                        setShowLocationPicker(true);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 transition-colors"
                    >
                      <MapPin className="h-4 w-4 text-amber-400" />
                      <span>Share Location</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowAttachmentMenu(false);
                        setShowContactPicker(true);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 transition-colors"
                    >
                      <UserIcon className="h-4 w-4 text-cyan-400" />
                      <span>Share Contact</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Emoji Drawer Button */}
              <div className="relative">
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  title="Emoji & Stickers"
                  className="flex h-10 w-10 items-center justify-center rounded-full text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                >
                  <Smile className="h-5 w-5" />
                </button>

                {showEmojiPicker && (
                  <div className="absolute bottom-12 left-0 z-30 w-72 rounded-2xl border border-slate-800 bg-slate-900 p-3 shadow-2xl animate-in slide-in-from-bottom duration-150">
                    <div className="text-[11px] font-semibold text-slate-400 mb-2">Emojis & Stickers</div>
                    <div className="grid grid-cols-6 gap-2 text-xl max-h-48 overflow-y-auto">
                      {['😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😚','😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🤩','🥳','😏','😒','😞','😔','😟','😕','🙁','☹️','😣','😖','😫','😩','🥺','😢','😭','😤','😠','😡','🤬','🤯','😳','🥵','🥶','😱','😨','👍','👎','👏','🙌','🔥','❤️','🎉','✨','🚀','💯','🔒','💎'].map((e) => (
                        <button
                          key={e}
                          onClick={() => {
                            setInputText((prev) => prev + e);
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded hover:bg-slate-800 text-base"
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Text Input */}
              <input
                type="text"
                placeholder="Type an encrypted message..."
                value={inputText}
                onChange={handleInputChange}
                onKeyDown={handleKeyPress}
                className="flex-1 rounded-2xl border border-slate-700/80 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />

              {/* Voice Note Button or Send Button */}
              {inputText.trim() || editingMessage ? (
                <button
                  onClick={handleSend}
                  title="Send message"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-600 text-white shadow-md shadow-cyan-600/30 hover:bg-cyan-500 transition-transform active:scale-95"
                >
                  <Send className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={() => setIsRecordingVoice(true)}
                  title="Record voice message"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-800 text-cyan-400 hover:bg-slate-700 hover:text-cyan-300 transition-colors"
                >
                  <Mic className="h-4 w-4" />
                </button>
              )}
            </div>
          )}

          {/* Hidden File Input for Image/Video/Document */}
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>

      {/* DETAIL / INFO DRAWER */}
      {showDetailDrawer && (
        <ChatDetailDrawer
          chat={activeChat}
          messages={messages}
          onClose={() => setShowDetailDrawer(false)}
          onStartCall={handleStartCall}
        />
      )}

      {/* MODALS */}
      <LocationPickerModal
        isOpen={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onSendLocation={(loc) => {
          sendMessage('', 'location', {
            type: 'location',
            url: '',
            location: loc,
          });
        }}
      />

      <ContactPickerModal
        isOpen={showContactPicker}
        onClose={() => setShowContactPicker(false)}
        onSelectContact={(contact) => {
          sendMessage('', 'contact', {
            type: 'contact',
            url: '',
            contact,
          });
        }}
      />

      <ForwardMessageModal
        message={forwardingMessage}
        onClose={() => setForwardingMessage(null)}
      />
    </div>
  );
};
