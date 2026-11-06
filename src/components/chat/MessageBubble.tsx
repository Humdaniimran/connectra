import React, { useState, useRef } from 'react';
import { Message, User } from '../../types/index.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useChat } from '../../context/ChatContext.tsx';
import {
  Check,
  CheckCheck,
  Play,
  Pause,
  FileText,
  MapPin,
  User as UserIcon,
  Smile,
  Reply,
  Copy,
  Forward,
  Edit2,
  Trash2,
  Pin,
  Star,
  ExternalLink,
} from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
  sender: User | undefined;
  isGroup: boolean;
  onOpenMedia?: (url: string, type: 'image' | 'video') => void;
  onOpenForward?: (msg: Message) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  sender,
  isGroup,
  onOpenMedia,
  onOpenForward,
}) => {
  const { currentUser } = useAuth();
  const {
    reactToMessage,
    deleteMessage,
    pinMessage,
    starMessage,
    setReplyingTo,
    setEditingMessage,
    starredMessageIds,
  } = useChat();

  const isMe = message.senderId === currentUser?.id;
  const isDeletedForMe = message.deletedForUserIds?.includes(currentUser?.id || '');
  const isStarred = starredMessageIds.has(message.id);

  // Audio note playback state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Quick Action Menu Popover
  const [showActions, setShowActions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  if (isDeletedForMe) return null;

  // Format local timestamp
  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const handleTogglePlayAudio = () => {
    if (!audioRef.current) {
      if (message.attachment?.url) {
        const audio = new Audio(message.attachment.url);
        audioRef.current = audio;
        audio.playbackRate = playbackSpeed;
        audio.ontimeupdate = () => {
          if (audio.duration) {
            setAudioProgress((audio.currentTime / audio.duration) * 100);
          }
        };
        audio.onended = () => {
          setIsPlayingAudio(false);
          setAudioProgress(0);
        };
      } else {
        // Simulated playback if no real stream was recorded
        setIsPlayingAudio(!isPlayingAudio);
        return;
      }
    }

    if (isPlayingAudio) {
      audioRef.current?.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current?.play().catch(() => {});
      setIsPlayingAudio(true);
    }
  };

  const cycleSpeed = () => {
    const nextSpeed = playbackSpeed === 1 ? 1.5 : playbackSpeed === 1.5 ? 2 : 1;
    setPlaybackSpeed(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content || '');
    setShowActions(false);
  };

  const commonEmojis = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '🎉'];

  return (
    <div
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setShowEmojiPicker(false);
      }}
      className={`group relative flex w-full flex-col my-1 ${
        isMe ? 'items-end' : 'items-start'
      }`}
    >
      {/* Group Sender Name */}
      {isGroup && !isMe && sender && (
        <span className="text-[11px] font-semibold text-cyan-400 mb-0.5 ml-2">
          {sender.name}
        </span>
      )}

      {/* Bubble Container */}
      <div className="relative max-w-[85%] sm:max-w-[70%]">
        {/* Forwarded Header */}
        {message.forwarded && (
          <div className="flex items-center gap-1 text-[10px] text-slate-400 italic mb-0.5 ml-1">
            <Forward className="h-3 w-3" />
            <span>Forwarded</span>
          </div>
        )}

        <div
          className={`relative rounded-2xl px-3.5 py-2 shadow-sm text-sm break-words transition-all ${
            isMe
              ? 'bg-gradient-to-r from-cyan-600 to-sky-600 text-white rounded-br-xs'
              : 'bg-slate-800/90 border border-slate-700/60 text-slate-100 rounded-bl-xs'
          }`}
        >
          {/* Quoted Reply Block */}
          {message.replyTo && (
            <div className={`mb-2 rounded-lg p-2 text-xs border-l-2 ${
              isMe ? 'bg-cyan-700/60 border-white/60 text-cyan-100' : 'bg-slate-900/60 border-cyan-400 text-slate-300'
            }`}>
              <div className="font-semibold text-[11px] text-cyan-200">
                {message.replyTo.senderName}
              </div>
              <div className="line-clamp-2 opacity-90 text-[11px]">
                {message.replyTo.content}
              </div>
            </div>
          )}

          {/* ATTACHMENT: Image */}
          {message.type === 'image' && message.attachment?.url && (
            <div className="mb-1.5 overflow-hidden rounded-xl cursor-pointer" onClick={() => onOpenMedia && onOpenMedia(message.attachment!.url, 'image')}>
              <img
                src={message.attachment.url}
                alt={message.attachment.fileName || 'Shared image'}
                referrerPolicy="no-referrer"
                className="max-h-64 w-full rounded-xl object-cover hover:scale-[1.01] transition-transform"
              />
            </div>
          )}

          {/* ATTACHMENT: Video */}
          {message.type === 'video' && message.attachment?.url && (
            <div className="mb-1.5 overflow-hidden rounded-xl">
              <video
                src={message.attachment.url}
                controls
                className="max-h-64 w-full rounded-xl object-cover"
              />
            </div>
          )}

          {/* ATTACHMENT: Audio Voice Note */}
          {message.type === 'audio' && (
            <div className="my-1 flex items-center gap-3 min-w-[220px]">
              <button
                onClick={handleTogglePlayAudio}
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-transform active:scale-95 ${
                  isMe ? 'bg-white text-cyan-700' : 'bg-cyan-500 text-slate-950'
                }`}
              >
                {isPlayingAudio ? (
                  <Pause className="h-5 w-5 fill-current" />
                ) : (
                  <Play className="h-5 w-5 fill-current ml-0.5" />
                )}
              </button>

              <div className="flex-1">
                {/* Simulated Audio Waveform Bar */}
                <div className="relative h-6 w-full flex items-center gap-0.5">
                  {[25, 40, 70, 90, 50, 30, 60, 85, 45, 75, 35, 60, 80, 40, 65, 30, 50].map((h, i) => {
                    const barPercent = (i / 17) * 100;
                    const isPlayed = audioProgress >= barPercent;
                    return (
                      <span
                        key={i}
                        className={`flex-1 rounded-full transition-colors ${
                          isPlayed
                            ? isMe ? 'bg-white' : 'bg-cyan-400'
                            : isMe ? 'bg-white/40' : 'bg-slate-600'
                        }`}
                        style={{ height: `${h}%` }}
                      />
                    );
                  })}
                </div>

                <div className="flex items-center justify-between text-[10px] opacity-80 mt-1 font-mono">
                  <span>
                    {message.attachment?.duration
                      ? `${Math.floor(message.attachment.duration / 60)}:${(message.attachment.duration % 60).toString().padStart(2, '0')}`
                      : '0:15'}
                  </span>
                  <button
                    onClick={cycleSpeed}
                    className="font-bold px-1 rounded bg-black/20 hover:bg-black/30"
                  >
                    {playbackSpeed}x
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ATTACHMENT: Document */}
          {message.type === 'document' && (
            <div className={`my-1 flex items-center gap-3 rounded-xl p-2.5 ${
              isMe ? 'bg-cyan-700/60' : 'bg-slate-900/60'
            }`}>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-300">
                <FileText className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="truncate text-xs font-medium">{message.attachment?.fileName || 'Document.pdf'}</div>
                <div className="text-[10px] opacity-75">{message.attachment?.fileSize || '2.4 MB'}</div>
              </div>
              <a
                href={message.attachment?.url || '#'}
                download
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/20 hover:bg-black/40"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          )}

          {/* ATTACHMENT: Location */}
          {message.type === 'location' && message.attachment?.location && (
            <div className={`my-1 rounded-xl overflow-hidden ${isMe ? 'bg-cyan-700/60' : 'bg-slate-900/60'}`}>
              <div className="relative h-24 w-full bg-slate-950 flex items-center justify-center border-b border-black/20">
                <MapPin className="h-6 w-6 text-rose-500 animate-bounce" />
              </div>
              <div className="p-2.5">
                <div className="text-xs font-semibold">{message.attachment.location.address}</div>
                <a
                  href={`https://maps.google.com/?q=${message.attachment.location.latitude},${message.attachment.location.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-[11px] text-cyan-300 hover:underline"
                >
                  <span>Open in Maps</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          )}

          {/* ATTACHMENT: Contact */}
          {message.type === 'contact' && message.attachment?.contact && (
            <div className={`my-1 flex items-center gap-3 rounded-xl p-2.5 ${
              isMe ? 'bg-cyan-700/60' : 'bg-slate-900/60'
            }`}>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-300">
                <UserIcon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-semibold">{message.attachment.contact.name}</div>
                <div className="text-[11px] opacity-80 font-mono">{message.attachment.contact.phoneNumber}</div>
              </div>
            </div>
          )}

          {/* Message Text Content */}
          {message.content && (
            <p className="whitespace-pre-wrap leading-relaxed text-sm">
              {message.content}
            </p>
          )}

          {/* Meta Info: Edited, Starred, Time, Status ticks */}
          <div className="flex items-center justify-end gap-1 text-[10px] opacity-75 mt-1 select-none tabular-nums font-mono">
            {message.isEdited && <span>(edited)</span>}
            {isStarred && <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />}
            <span>{formatTime(message.createdAt)}</span>
            {isMe && (
              <span className="ml-0.5">
                {message.status === 'read' ? (
                  <CheckCheck className="h-3.5 w-3.5 text-cyan-200" />
                ) : message.status === 'delivered' ? (
                  <CheckCheck className="h-3.5 w-3.5 text-slate-300" />
                ) : (
                  <Check className="h-3.5 w-3.5 text-slate-300" />
                )}
              </span>
            )}
          </div>
        </div>

        {/* Reaction Badges */}
        {message.reactions && Object.keys(message.reactions).length > 0 && (
          <div className={`flex flex-wrap items-center gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
            {Object.entries(message.reactions).map(([emoji, userIds]) => {
              const hasReacted = currentUser && userIds.includes(currentUser.id);
              return (
                <button
                  key={emoji}
                  onClick={() => reactToMessage(message.id, emoji)}
                  className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs transition-colors ${
                    hasReacted
                      ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-300'
                      : 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <span>{emoji}</span>
                  <span className="text-[10px] font-mono tabular-nums">{userIds.length}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Quick Action Float Bar on Hover */}
        {showActions && (
          <div
            className={`absolute -top-9 z-20 flex items-center gap-0.5 rounded-full border border-slate-700 bg-slate-900/95 p-1 shadow-lg backdrop-blur-md transition-all ${
              isMe ? 'right-0' : 'left-0'
            }`}
          >
            {/* React Button */}
            <div className="relative">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                title="React"
                className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <Smile className="h-3.5 w-3.5" />
              </button>

              {/* Emoji Picker Popover */}
              {showEmojiPicker && (
                <div className="absolute top-8 left-0 z-30 flex items-center gap-1 rounded-full border border-slate-700 bg-slate-900 p-1.5 shadow-xl">
                  {commonEmojis.map((em) => (
                    <button
                      key={em}
                      onClick={() => {
                        reactToMessage(message.id, em);
                        setShowEmojiPicker(false);
                      }}
                      className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-slate-800 text-sm hover:scale-125 transition-transform"
                    >
                      {em}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Reply */}
            <button
              onClick={() => setReplyingTo(message)}
              title="Reply"
              className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <Reply className="h-3.5 w-3.5" />
            </button>

            {/* Copy */}
            <button
              onClick={handleCopy}
              title="Copy text"
              className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>

            {/* Forward */}
            <button
              onClick={() => onOpenForward && onOpenForward(message)}
              title="Forward message"
              className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <Forward className="h-3.5 w-3.5" />
            </button>

            {/* Star */}
            <button
              onClick={() => starMessage(message.id)}
              title={isStarred ? 'Unstar message' : 'Star message'}
              className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-800 hover:text-amber-400"
            >
              <Star className={`h-3.5 w-3.5 ${isStarred ? 'fill-amber-400 text-amber-400' : ''}`} />
            </button>

            {/* Pin */}
            <button
              onClick={() => pinMessage(message.id, !message.isPinned)}
              title={message.isPinned ? 'Unpin message' : 'Pin message'}
              className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-800 hover:text-cyan-400"
            >
              <Pin className={`h-3.5 w-3.5 ${message.isPinned ? 'text-cyan-400' : ''}`} />
            </button>

            {/* Edit (if own text message) */}
            {isMe && message.type === 'text' && (
              <button
                onClick={() => setEditingMessage(message)}
                title="Edit message"
                className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-800 hover:text-cyan-400"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </button>
            )}

            {/* Delete */}
            <button
              onClick={() => {
                const forEveryone = isMe ? window.confirm('Delete for everyone?') : false;
                deleteMessage(message.id, forEveryone);
              }}
              title="Delete message"
              className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-800 hover:text-rose-400"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
