import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { StatusUpdate } from '../../types/index.ts';
import { X, Image as ImageIcon, Type, Sparkles, Send, Globe, Users } from 'lucide-react';

interface CreateStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (newStatus: StatusUpdate) => void;
}

const colorThemes = [
  { name: 'Sapphire Cyan', gradient: 'from-sky-600 to-cyan-700' },
  { name: 'Emerald Teal', gradient: 'from-teal-600 to-emerald-700' },
  { name: 'Electric Violet', gradient: 'from-indigo-600 to-purple-700' },
  { name: 'Sunset Amber', gradient: 'from-rose-600 to-amber-600' },
  { name: 'Deep Oceanic', gradient: 'from-slate-900 via-sky-950 to-slate-900' },
];

export const CreateStatusModal: React.FC<CreateStatusModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const { currentUser } = useAuth();
  const [mode, setMode] = useState<'text' | 'media'>('text');
  const [textContent, setTextContent] = useState('');
  const [caption, setCaption] = useState('');
  const [selectedGradient, setSelectedGradient] = useState(colorThemes[0].gradient);
  const [mediaDataUrl, setMediaDataUrl] = useState('');
  const [audience, setAudience] = useState<'everyone' | 'contacts'>('contacts');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaDataUrl(reader.result as string);
      setMode('media');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (mode === 'text' && !textContent.trim()) return;
    if (mode === 'media' && !mediaDataUrl) return;

    setIsSubmitting(true);
    try {
      const created = await api.createStatus({
        userId: currentUser.id,
        type: mode === 'media' ? 'image' : 'text',
        content: mode === 'text' ? textContent.trim() : undefined,
        mediaUrl: mode === 'media' ? mediaDataUrl : undefined,
        backgroundColor: selectedGradient,
        caption: mode === 'media' ? caption.trim() : undefined,
      });

      onCreated(created);
      onClose();
    } catch (err) {
      console.error('Failed to create status:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3.5 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-cyan-400" />
            <span className="text-sm font-semibold text-white">Create Status (24 Hours)</span>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Mode selector */}
        <div className="grid grid-cols-2 gap-1 p-2 bg-slate-950 border-b border-slate-800 text-xs font-medium">
          <button
            type="button"
            onClick={() => setMode('text')}
            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-colors ${
              mode === 'text'
                ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Type className="h-4 w-4" />
            <span>Text Status</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (!mediaDataUrl) {
                fileInputRef.current?.click();
              } else {
                setMode('media');
              }
            }}
            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-colors ${
              mode === 'media'
                ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ImageIcon className="h-4 w-4" />
            <span>Photo Status</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {mode === 'text' ? (
            <div>
              {/* Preview Box */}
              <div
                className={`relative flex min-h-[180px] w-full items-center justify-center rounded-2xl p-6 text-center shadow-inner transition-all bg-gradient-to-tr ${selectedGradient}`}
              >
                <textarea
                  placeholder="What's happening? Share a status..."
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  maxLength={280}
                  className="w-full bg-transparent text-center font-bold text-lg text-white placeholder-white/70 focus:outline-none resize-none"
                  rows={4}
                  autoFocus
                />
              </div>

              {/* Theme color choices */}
              <div className="mt-3 flex items-center justify-center gap-2">
                {colorThemes.map((theme) => (
                  <button
                    key={theme.name}
                    type="button"
                    title={theme.name}
                    onClick={() => setSelectedGradient(theme.gradient)}
                    className={`h-7 w-7 rounded-full bg-gradient-to-tr ${theme.gradient} transition-transform ${
                      selectedGradient === theme.gradient ? 'scale-125 ring-2 ring-white' : 'opacity-80'
                    }`}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div>
              {mediaDataUrl ? (
                <div className="relative h-56 w-full rounded-2xl overflow-hidden bg-black flex items-center justify-center">
                  <img
                    src={mediaDataUrl}
                    alt="Upload Preview"
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute top-2 right-2 rounded-lg bg-black/60 px-2.5 py-1 text-xs text-white backdrop-blur-md"
                  >
                    Change photo
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-48 w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-700 bg-slate-950/60 p-6 text-center hover:border-cyan-500"
                >
                  <ImageIcon className="h-10 w-10 text-slate-500 mb-2" />
                  <span className="text-xs font-semibold text-slate-300">Choose a photo</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">Supports JPG, PNG up to 10MB</span>
                </div>
              )}

              <div className="mt-3">
                <input
                  type="text"
                  placeholder="Add a caption..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          )}

          {/* Privacy Audience selector */}
          <div className="flex items-center justify-between rounded-xl bg-slate-950 p-3 border border-slate-800 text-xs">
            <span className="text-slate-400">Audience:</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setAudience('contacts')}
                className={`flex items-center gap-1 rounded-md px-2 py-1 transition-colors ${
                  audience === 'contacts'
                    ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                    : 'text-slate-400'
                }`}
              >
                <Users className="h-3 w-3" />
                <span>My Contacts</span>
              </button>
              <button
                type="button"
                onClick={() => setAudience('everyone')}
                className={`flex items-center gap-1 rounded-md px-2 py-1 transition-colors ${
                  audience === 'everyone'
                    ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                    : 'text-slate-400'
                }`}
              >
                <Globe className="h-3 w-3" />
                <span>Everyone</span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || (mode === 'text' && !textContent.trim()) || (mode === 'media' && !mediaDataUrl)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 py-3 text-xs font-bold text-white shadow-lg shadow-cyan-600/20 hover:bg-cyan-500 transition-colors disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            <span>{isSubmitting ? 'Posting...' : 'Share to Status'}</span>
          </button>
        </form>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
};
