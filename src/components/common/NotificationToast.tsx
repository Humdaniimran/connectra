import React from 'react';
import { Avatar } from './Avatar.tsx';
import { Message, User } from '../../types/index.ts';
import { X, MessageSquare } from 'lucide-react';

interface NotificationToastProps {
  notification: {
    message: Message;
    sender: User | null;
    chatTitle: string;
  } | null;
  onOpen: () => void;
  onDismiss: () => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  onOpen,
  onDismiss,
}) => {
  if (!notification) return null;

  const { message, sender, chatTitle } = notification;

  const getPreviewText = () => {
    switch (message.type) {
      case 'image':
        return '📷 Photo';
      case 'video':
        return '📹 Video';
      case 'audio':
        return '🎤 Voice message';
      case 'document':
        return `📄 ${message.attachment?.fileName || 'Document'}`;
      case 'location':
        return '📍 Location shared';
      case 'contact':
        return '👤 Contact card';
      default:
        return message.content || 'New message';
    }
  };

  return (
    <div
      role="alert"
      aria-live="polite"
      className="fixed top-16 right-4 sm:right-6 z-50 max-w-sm w-full animate-in slide-in-from-top-4 fade-in duration-300"
    >
      <div
        onClick={onOpen}
        className="flex items-start gap-3 rounded-2xl border border-cyan-500/30 bg-slate-900/95 p-3.5 shadow-2xl backdrop-blur-xl ring-1 ring-cyan-500/20 cursor-pointer hover:bg-slate-800/90 transition-all group"
      >
        <Avatar
          src={sender?.avatar}
          name={sender?.name || chatTitle}
          size="sm"
        />

        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-white truncate">
              {chatTitle}
            </span>
            <span className="text-[10px] text-cyan-400 font-mono">
              Just now
            </span>
          </div>

          <p className="mt-0.5 text-xs text-slate-300 line-clamp-2 leading-relaxed">
            {sender?.name && chatTitle !== sender.name && (
              <span className="font-semibold text-slate-400 mr-1">
                {sender.name}:
              </span>
            )}
            {getPreviewText()}
          </p>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Dismiss notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
