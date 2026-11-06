import React, { useState, useEffect } from 'react';
import { StatusUpdate } from '../../types/index.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useChat } from '../../context/ChatContext.tsx';
import { Avatar } from '../common/Avatar.tsx';
import { X, Eye, Send, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { api } from '../../services/api.ts';

interface StatusViewerModalProps {
  statuses: StatusUpdate[];
  initialIndex?: number;
  onClose: () => void;
}

export const StatusViewerModal: React.FC<StatusViewerModalProps> = ({
  statuses,
  initialIndex = 0,
  onClose,
}) => {
  const { currentUser, allUsers } = useAuth();
  const { createDirectChat, sendMessage } = useChat();

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showViewersSheet, setShowViewersSheet] = useState(false);

  const currentStatus = statuses[currentIndex];
  const isMyStatus = currentStatus?.userId === currentUser?.id;

  // Mark status as viewed by me
  useEffect(() => {
    if (currentStatus && currentUser && !isMyStatus) {
      api.markStatusViewed(currentStatus.id, currentUser.id).catch(() => {});
    }
  }, [currentStatus?.id, currentUser?.id]);

  // Timer loop for story progress
  useEffect(() => {
    if (isPaused || !currentStatus) return;

    const interval = window.setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (currentIndex < statuses.length - 1) {
            setCurrentIndex((i) => i + 1);
            return 0;
          } else {
            onClose();
            return 100;
          }
        }
        return prev + 2;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [currentIndex, isPaused, statuses.length]);

  if (!currentStatus) return null;

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setProgress(0);
    }
  };

  const handleNext = () => {
    if (currentIndex < statuses.length - 1) {
      setCurrentIndex((i) => i + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !currentUser) return;
    try {
      const chat = await createDirectChat(currentStatus.userId);
      await sendMessage(`Replying to status: "${currentStatus.caption || currentStatus.content || 'Photo'}"\n\n${replyText}`);
      setReplyText('');
      onClose();
    } catch (e) {
      console.error('Failed to send status reply:', e);
    }
  };

  const formatTimeAgo = (isoString: string) => {
    try {
      const diffMin = Math.round((Date.now() - new Date(isoString).getTime()) / 60000);
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHours = Math.round(diffMin / 60);
      return `${diffHours}h ago`;
    } catch {
      return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-0 sm:p-4 backdrop-blur-2xl animate-in fade-in duration-200">
      <div className="relative h-full w-full sm:h-[840px] sm:max-w-md sm:rounded-3xl overflow-hidden bg-slate-950 flex flex-col justify-between shadow-2xl border border-slate-800">
        {/* Top Progress Bars */}
        <div className="absolute top-3 left-3 right-3 z-30 flex items-center gap-1.5">
          {statuses.map((s, idx) => {
            const barProgress =
              idx < currentIndex ? 100 : idx === currentIndex ? progress : 0;
            return (
              <div
                key={s.id}
                className="h-1 flex-1 rounded-full bg-white/30 overflow-hidden"
              >
                <div
                  className="h-full bg-white transition-all duration-100"
                  style={{ width: `${barProgress}%` }}
                />
              </div>
            );
          })}
        </div>

        {/* Story Author Header */}
        <div className="absolute top-7 left-4 right-4 z-30 flex items-center justify-between text-white drop-shadow">
          <div className="flex items-center gap-2.5">
            <Avatar
              src={currentStatus.user.avatar}
              name={currentStatus.user.name}
              size="sm"
              className="ring-2 ring-white/40"
            />
            <div>
              <div className="text-xs font-bold leading-none">{currentStatus.user.name}</div>
              <div className="text-[10px] text-white/80 font-mono mt-0.5">
                {formatTimeAgo(currentStatus.createdAt)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60"
            >
              {isPaused ? <Play className="h-3.5 w-3.5 fill-current" /> : <Pause className="h-3.5 w-3.5 fill-current" />}
            </button>
            <button
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tap areas to go next / prev */}
        <div
          onClick={handlePrev}
          className="absolute left-0 top-16 bottom-20 w-1/3 z-20 cursor-pointer"
        />
        <div
          onClick={handleNext}
          className="absolute right-0 top-16 bottom-20 w-1/3 z-20 cursor-pointer"
        />

        {/* Main Status Canvas */}
        <div className="relative h-full w-full flex items-center justify-center overflow-hidden">
          {currentStatus.type === 'text' ? (
            <div
              className={`h-full w-full flex flex-col items-center justify-center p-8 text-center bg-gradient-to-tr ${
                currentStatus.backgroundColor || 'from-sky-600 to-cyan-700'
              }`}
            >
              <p className="text-xl sm:text-2xl font-bold text-white leading-relaxed max-w-sm drop-shadow">
                {currentStatus.content}
              </p>
            </div>
          ) : (
            <div className="relative h-full w-full flex items-center justify-center bg-black">
              {currentStatus.mediaUrl && (
                <img
                  src={currentStatus.mediaUrl}
                  alt="Status"
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
              )}
              {/* Dark Scrim */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
              {currentStatus.caption && (
                <div className="absolute bottom-20 left-4 right-4 text-center z-20">
                  <p className="rounded-xl bg-black/60 p-3 text-xs text-white backdrop-blur-md inline-block">
                    {currentStatus.caption}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer / Reply / Viewers bar */}
        <div className="relative z-30 border-t border-white/10 bg-black/80 p-3 backdrop-blur-md">
          {isMyStatus ? (
            <div className="flex items-center justify-between text-xs text-slate-300">
              <button
                onClick={() => setShowViewersSheet(!showViewersSheet)}
                className="flex items-center gap-1.5 hover:text-white"
              >
                <Eye className="h-4 w-4 text-cyan-400" />
                <span className="font-semibold">{currentStatus.viewers.length} views</span>
              </button>
              <span className="text-[10px] text-slate-400">Expires in 24 hours</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder={`Reply to ${currentStatus.user.name}...`}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onFocus={() => setIsPaused(true)}
                onBlur={() => setIsPaused(false)}
                className="flex-1 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs text-white placeholder-white/60 focus:outline-none focus:border-cyan-400"
              />
              <button
                onClick={handleSendReply}
                title="Send Reply"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-600 text-white hover:bg-cyan-500"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Viewers Sheet (for my status) */}
        {showViewersSheet && (
          <div className="absolute inset-x-0 bottom-0 z-40 max-h-64 overflow-y-auto rounded-t-3xl border-t border-slate-800 bg-slate-900 p-4 shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-bold text-white">
                Viewed by ({currentStatus.viewers.length})
              </span>
              <button
                onClick={() => setShowViewersSheet(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="divide-y divide-slate-800/40 mt-2">
              {currentStatus.viewers.map((v) => {
                const viewer = allUsers.find((u) => u.id === v.userId);
                return (
                  <div key={v.userId} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <Avatar src={viewer?.avatar} name={viewer?.name || 'Contact'} size="xs" />
                      <span className="text-xs text-slate-200">{viewer?.name || 'Contact'}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {formatTimeAgo(v.viewedAt)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
