import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { Avatar } from '../common/Avatar.tsx';
import { X, QrCode, ScanLine, Share2, Download, Copy, Check } from 'lucide-react';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({ isOpen, onClose }) => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'my_code' | 'scanner'>('my_code');
  const [copied, setCopied] = useState(false);
  const [scanResult, setScanResult] = useState('');

  if (!isOpen || !currentUser) return null;

  const profileUrl = `https://connectra.app/user/@${currentUser.username}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3.5 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <QrCode className="h-4 w-4 text-cyan-400" />
            <span className="text-sm font-semibold text-white">QR Code</span>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 gap-1 p-2 bg-slate-950 border-b border-slate-800 text-xs font-medium">
          <button
            onClick={() => setActiveTab('my_code')}
            className={`py-1.5 rounded-lg transition-colors ${
              activeTab === 'my_code'
                ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            My Profile QR
          </button>
          <button
            onClick={() => setActiveTab('scanner')}
            className={`py-1.5 rounded-lg transition-colors ${
              activeTab === 'scanner'
                ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Scan QR Code
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'my_code' ? (
            <div className="flex flex-col items-center text-center">
              <Avatar src={currentUser.avatar} name={currentUser.name} size="lg" className="ring-2 ring-cyan-400 mb-2" />
              <h3 className="text-base font-bold text-white">{currentUser.name}</h3>
              <p className="text-xs text-slate-400 font-mono">@{currentUser.username}</p>

              {/* Vector Simulated QR Code */}
              <div className="mt-5 p-4 rounded-2xl bg-white shadow-xl flex items-center justify-center">
                <svg
                  viewBox="0 0 100 100"
                  className="w-48 h-48 text-slate-950 fill-current"
                >
                  {/* Top-left locator */}
                  <rect x="5" y="5" width="25" height="25" rx="3" />
                  <rect x="9" y="9" width="17" height="17" fill="white" />
                  <rect x="13" y="13" width="9" height="9" />

                  {/* Top-right locator */}
                  <rect x="70" y="5" width="25" height="25" rx="3" />
                  <rect x="74" y="9" width="17" height="17" fill="white" />
                  <rect x="78" y="13" width="9" height="9" />

                  {/* Bottom-left locator */}
                  <rect x="5" y="70" width="25" height="25" rx="3" />
                  <rect x="9" y="74" width="17" height="17" fill="white" />
                  <rect x="13" y="78" width="9" height="9" />

                  {/* Pattern modules */}
                  <rect x="35" y="10" width="6" height="6" />
                  <rect x="45" y="10" width="6" height="6" />
                  <rect x="55" y="10" width="6" height="6" />
                  <rect x="35" y="20" width="6" height="6" />
                  <rect x="50" y="25" width="6" height="6" />
                  <rect x="10" y="40" width="6" height="6" />
                  <rect x="25" y="45" width="6" height="6" />
                  <rect x="40" y="40" width="20" height="20" rx="3" fill="#0284c7" />
                  <circle cx="50" cy="50" r="5" fill="white" />
                  <rect x="70" y="40" width="6" height="6" />
                  <rect x="80" y="50" width="6" height="6" />
                  <rect x="35" y="70" width="6" height="6" />
                  <rect x="45" y="75" width="6" height="6" />
                  <rect x="60" y="70" width="6" height="6" />
                  <rect x="75" y="80" width="6" height="6" />
                  <rect x="85" y="70" width="6" height="6" />
                  <rect x="70" y="85" width="6" height="6" />
                </svg>
              </div>

              <p className="mt-4 text-[11px] text-slate-400">
                Your QR code is private. If you share it, others can scan it to message you.
              </p>

              <div className="mt-5 flex w-full gap-2">
                <button
                  onClick={handleCopyLink}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 py-2.5 text-xs font-semibold text-white hover:bg-slate-700"
                >
                  {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                  <span>{copied ? 'Link Copied' : 'Copy Link'}</span>
                </button>
                <button
                  onClick={() => alert('Profile QR image saved.')}
                  className="flex items-center justify-center rounded-xl bg-cyan-600 px-3.5 py-2.5 text-xs font-semibold text-white hover:bg-cyan-500 shadow-md shadow-cyan-600/20"
                >
                  <Download className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center">
              <div className="relative h-60 w-full rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden">
                <div className="relative flex flex-col items-center">
                  <div className="relative h-44 w-44 rounded-2xl border-2 border-cyan-400 flex items-center justify-center">
                    <ScanLine className="h-8 w-8 text-cyan-400 animate-pulse" />
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-bounce duration-1000" />
                  </div>
                </div>
              </div>

              <div className="mt-4 w-full">
                <label className="block text-xs font-medium text-slate-400 mb-1 text-left">
                  Or enter Connectra invite link manually:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="https://connectra.app/user/@username"
                    value={scanResult}
                    onChange={(e) => setScanResult(e.target.value)}
                    className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    onClick={() => {
                      if (scanResult.trim()) {
                        alert(`Found profile: ${scanResult}. Added to contacts!`);
                        onClose();
                      }
                    }}
                    className="rounded-xl bg-cyan-600 px-3 py-2 text-xs font-semibold text-white hover:bg-cyan-500"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
