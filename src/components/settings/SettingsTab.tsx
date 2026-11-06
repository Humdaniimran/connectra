import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useChat } from '../../context/ChatContext.tsx';
import { Avatar } from '../common/Avatar.tsx';
import { QRCodeModal } from '../contacts/QRCodeModal.tsx';
import { AdminDashboardModal } from './AdminDashboardModal.tsx';
import { api } from '../../services/api.ts';
import {
  User,
  Shield,
  Lock,
  MessageSquare,
  Bell,
  Palette,
  HardDrive,
  HelpCircle,
  QrCode,
  ChevronRight,
  LogOut,
  Trash2,
  Download,
  Check,
  Moon,
  Sun,
  ShieldAlert,
  Server,
  X,
  Key,
} from 'lucide-react';

export const SettingsTab: React.FC = () => {
  const {
    currentUser,
    updateProfile,
    allUsers,
    unblockUser,
    logout,
    deleteMyAccount,
    appPin,
    setAppPin,
  } = useAuth();
  const { clearChatHistory, chats } = useChat();

  const [showQRModal, setShowQRModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [activeSubMenu, setActiveSubMenu] = useState<
    'account' | 'privacy' | 'chats' | 'notifications' | 'appearance' | 'storage' | 'help' | null
  >(null);

  // Edit profile state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(currentUser?.name || '');
  const [editBio, setEditBio] = useState(currentUser?.bio || '');
  const [editAvatar, setEditAvatar] = useState(currentUser?.avatar || '');

  // Privacy states
  const [lastSeenAudience, setLastSeenAudience] = useState(currentUser?.privacy.lastSeen || 'everyone');
  const [readReceipts, setReadReceipts] = useState(currentUser?.privacy.readReceipts ?? true);

  // Chat settings states
  const [fontSize, setFontSize] = useState<'small' | 'normal' | 'large'>('normal');
  const [autoDownload, setAutoDownload] = useState(true);

  // Appearance states
  const [accentColor, setAccentColor] = useState('cyan');

  // App Lock PIN state
  const [pinInput, setPinInput] = useState('');
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

  // Cache cleared feedback
  const [cacheSize, setCacheSize] = useState('28.4 MB');

  if (!currentUser) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({
      name: editName.trim(),
      bio: editBio.trim(),
      avatar: editAvatar.trim(),
    });
    setIsEditingProfile(false);
  };

  const handleExportData = async () => {
    try {
      const data = await api.exportUserData(currentUser.id);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `connectra_archive_${currentUser.username}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to export data:', e);
    }
  };

  const handleClearCache = () => {
    setCacheSize('0.0 KB');
    alert('Temporary media cache, downloaded audio thumbnails, and render artifacts cleared.');
  };

  return (
    <div className="flex h-full w-full flex-col bg-slate-900/90 backdrop-blur-md">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 px-4 py-3 bg-slate-950/60">
        <h2 className="text-base font-bold text-white tracking-tight">Settings</h2>
        <button
          onClick={() => setShowQRModal(true)}
          title="My QR Code"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-cyan-400 transition-colors"
        >
          <QrCode className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Profile Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <Avatar
                src={currentUser.avatar}
                name={currentUser.name}
                size="lg"
                status={currentUser.status}
                showStatus
              />
              <div>
                <h3 className="text-sm font-bold text-white leading-tight">{currentUser.name}</h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  @{currentUser.username} · {currentUser.phoneNumber}
                </p>
                <p className="text-[11px] text-slate-300 mt-1 line-clamp-1 italic">
                  "{currentUser.bio}"
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setEditName(currentUser.name);
                setEditBio(currentUser.bio);
                setEditAvatar(currentUser.avatar);
                setIsEditingProfile(true);
              }}
              className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-cyan-400 hover:bg-slate-700 transition-colors"
            >
              Edit
            </button>
          </div>
        </div>

        {/* SETTINGS MENU LIST */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 divide-y divide-slate-800/40 overflow-hidden shadow-sm">
          {/* 1. Account Settings */}
          <button
            onClick={() => setActiveSubMenu('account')}
            className="flex w-full items-center justify-between p-3.5 hover:bg-slate-800/40 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                <Key className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-100">Account</div>
                <div className="text-[11px] text-slate-400">Security, Two-Step PIN, Data Export</div>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-500" />
          </button>

          {/* 2. Privacy Settings */}
          <button
            onClick={() => setActiveSubMenu('privacy')}
            className="flex w-full items-center justify-between p-3.5 hover:bg-slate-800/40 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                <Shield className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-100">Privacy</div>
                <div className="text-[11px] text-slate-400">Last Seen, Read Receipts, Blocked Users</div>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-500" />
          </button>

          {/* 3. Chat Settings */}
          <button
            onClick={() => setActiveSubMenu('chats')}
            className="flex w-full items-center justify-between p-3.5 hover:bg-slate-800/40 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
                <MessageSquare className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-100">Chats</div>
                <div className="text-[11px] text-slate-400">Wallpapers, Font Size, Media Downloads</div>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-500" />
          </button>

          {/* 4. Notification Settings */}
          <button
            onClick={() => setActiveSubMenu('notifications')}
            className="flex w-full items-center justify-between p-3.5 hover:bg-slate-800/40 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
                <Bell className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-100">Notifications</div>
                <div className="text-[11px] text-slate-400">Message Tones, Ringtone, Vibration</div>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-500" />
          </button>

          {/* 5. Storage & Data */}
          <button
            onClick={() => setActiveSubMenu('storage')}
            className="flex w-full items-center justify-between p-3.5 hover:bg-slate-800/40 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                <HardDrive className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-100">Storage & Data</div>
                <div className="text-[11px] text-slate-400">{cacheSize} used · Clear Cache</div>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-500" />
          </button>

          {/* 6. Admin Console */}
          <button
            onClick={() => setShowAdminModal(true)}
            className="flex w-full items-center justify-between p-3.5 hover:bg-slate-800/40 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400">
                <Server className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-100">Admin Console</div>
                <div className="text-[11px] text-slate-400">Cluster Telemetry, Sockets, Moderation</div>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-500" />
          </button>

          {/* 7. Help & Support */}
          <button
            onClick={() => setActiveSubMenu('help')}
            className="flex w-full items-center justify-between p-3.5 hover:bg-slate-800/40 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-500/10 text-slate-400">
                <HelpCircle className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-100">Help & Support</div>
                <div className="text-[11px] text-slate-400">FAQs, Privacy Policy, Terms, Version 2.4</div>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-500" />
          </button>
        </div>

        {/* Log out / Switch User */}
        <div className="pt-2 space-y-2">
          <button
            onClick={logout}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-950/70 py-3 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
          >
            <LogOut className="h-4 w-4 text-slate-400" />
            <span>Switch Account / Sign Out</span>
          </button>
        </div>
      </div>

      {/* SUB-MENU DRAWER / MODAL */}
      {activeSubMenu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3.5 bg-slate-950/60">
              <span className="text-sm font-bold text-white capitalize">{activeSubMenu} Settings</span>
              <button
                onClick={() => setActiveSubMenu(null)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              {/* SUBMENU: ACCOUNT */}
              {activeSubMenu === 'account' && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
                    <div className="font-semibold text-slate-200 mb-1">App Lock with PIN</div>
                    <p className="text-[11px] text-slate-400 mb-3">
                      Require a 4-digit security PIN whenever Connectra launches.
                    </p>
                    {appPin ? (
                      <div className="flex items-center justify-between">
                        <span className="text-emerald-400 font-medium">PIN Protection Enabled</span>
                        <button
                          onClick={() => setAppPin(null)}
                          className="rounded-lg bg-rose-600/20 text-rose-300 px-3 py-1 font-semibold hover:bg-rose-600/30"
                        >
                          Remove PIN
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="password"
                          maxLength={4}
                          placeholder="Set 4-digit PIN"
                          value={pinInput}
                          onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                          className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-center font-mono text-sm tracking-widest text-cyan-400 focus:outline-none"
                        />
                        <button
                          onClick={() => {
                            if (pinInput.length === 4) {
                              setAppPin(pinInput);
                              setPinInput('');
                            } else {
                              alert('PIN must be 4 digits');
                            }
                          }}
                          className="rounded-lg bg-cyan-600 px-3 py-1.5 font-semibold text-white hover:bg-cyan-500"
                        >
                          Enable
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
                    <div className="font-semibold text-slate-200 mb-1">Export Account Data</div>
                    <p className="text-[11px] text-slate-400 mb-3">
                      Download a JSON file containing all your chats, contact keys, and account settings.
                    </p>
                    <button
                      onClick={handleExportData}
                      className="flex items-center gap-1.5 rounded-lg bg-cyan-600 px-3 py-2 text-xs font-semibold text-white hover:bg-cyan-500"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download Archive</span>
                    </button>
                  </div>

                  <div className="rounded-xl border border-rose-900/30 bg-rose-950/10 p-3.5">
                    <div className="font-semibold text-rose-400 mb-1">Delete Account</div>
                    <p className="text-[11px] text-slate-400 mb-3">
                      Permanently wipes your encryption ratchets, identity keys, and conversation history.
                    </p>
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete your account permanently?')) {
                          deleteMyAccount();
                          setActiveSubMenu(null);
                        }
                      }}
                      className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Delete My Account</span>
                    </button>
                  </div>
                </div>
              )}

              {/* SUBMENU: PRIVACY */}
              {activeSubMenu === 'privacy' && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-2">
                    <div className="font-semibold text-slate-200">Last Seen & Online</div>
                    <select
                      value={lastSeenAudience}
                      onChange={(e) => {
                        const val = e.target.value as any;
                        setLastSeenAudience(val);
                        updateProfile({ privacy: { ...currentUser.privacy, lastSeen: val } });
                      }}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-white focus:outline-none"
                    >
                      <option value="everyone">Everyone</option>
                      <option value="contacts">My Contacts Only</option>
                      <option value="nobody">Nobody</option>
                    </select>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-200">Read Receipts</div>
                      <div className="text-[11px] text-slate-400">Show double blue checkmarks when read</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={readReceipts}
                      onChange={(e) => {
                        setReadReceipts(e.target.checked);
                        updateProfile({ privacy: { ...currentUser.privacy, readReceipts: e.target.checked } });
                      }}
                      className="h-4 w-4 rounded accent-cyan-500"
                    />
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
                    <div className="font-semibold text-slate-200 mb-2">
                      Blocked Contacts ({currentUser.blockedUserIds.length})
                    </div>
                    {currentUser.blockedUserIds.length === 0 ? (
                      <div className="text-[11px] text-slate-500">No blocked contacts</div>
                    ) : (
                      <div className="space-y-2">
                        {currentUser.blockedUserIds.map((id) => {
                          const u = allUsers.find((user) => user.id === id);
                          return (
                            <div key={id} className="flex items-center justify-between">
                              <span className="text-slate-300">{u?.name || id}</span>
                              <button
                                onClick={() => unblockUser(id)}
                                className="text-cyan-400 hover:underline"
                              >
                                Unblock
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SUBMENU: CHATS */}
              {activeSubMenu === 'chats' && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-2">
                    <div className="font-semibold text-slate-200">Chat Font Size</div>
                    <div className="flex gap-2">
                      {(['small', 'normal', 'large'] as const).map((s) => (
                        <button
                          key={s}
                          onClick={() => setFontSize(s)}
                          className={`flex-1 rounded-lg py-1.5 capitalize transition-colors ${
                            fontSize === s ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'bg-slate-900 text-slate-400'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-200">Auto-Download Media</div>
                      <div className="text-[11px] text-slate-400">Automatically download photos over Wi-Fi</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={autoDownload}
                      onChange={(e) => setAutoDownload(e.target.checked)}
                      className="h-4 w-4 rounded accent-cyan-500"
                    />
                  </div>
                </div>
              )}

              {/* SUBMENU: NOTIFICATIONS */}
              {activeSubMenu === 'notifications' && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-3">
                    <div className="font-semibold text-slate-200">In-App Sound Effects</div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">Message Sent Chime</span>
                      <input type="checkbox" defaultChecked className="h-4 w-4 accent-cyan-500" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">Outgoing Ringback Tone</span>
                      <input type="checkbox" defaultChecked className="h-4 w-4 accent-cyan-500" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">Incoming Melodic Ringtone</span>
                      <input type="checkbox" defaultChecked className="h-4 w-4 accent-cyan-500" />
                    </div>
                  </div>
                </div>
              )}

              {/* SUBMENU: STORAGE */}
              {activeSubMenu === 'storage' && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-3">
                    <div className="font-semibold text-slate-200">Storage Distribution</div>
                    <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden flex">
                      <div className="h-full bg-cyan-500 w-[45%]" title="Photos & Videos" />
                      <div className="h-full bg-emerald-500 w-[25%]" title="Audio Notes" />
                      <div className="h-full bg-indigo-500 w-[20%]" title="Documents" />
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                      <span>Media: 12.8 MB</span>
                      <span>Audio: 7.1 MB</span>
                      <span>Docs: 5.7 MB</span>
                    </div>

                    <button
                      onClick={handleClearCache}
                      className="w-full rounded-xl bg-slate-800 py-2.5 font-semibold text-cyan-400 hover:bg-slate-700 mt-2"
                    >
                      Clear Media Cache ({cacheSize})
                    </button>
                  </div>
                </div>
              )}

              {/* SUBMENU: HELP */}
              {activeSubMenu === 'help' && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-2">
                    <div className="font-semibold text-slate-200">Frequently Asked Questions</div>
                    <div className="space-y-2 text-[11px] text-slate-400 leading-relaxed">
                      <div>
                        <strong className="text-slate-200 block">Is Connectra end-to-end encrypted?</strong>
                        Yes, one-to-one messages and voice/video sessions employ end-to-end encryption with double ratcheted cryptographic safety numbers.
                      </div>
                      <div>
                        <strong className="text-slate-200 block">How do audio and video calls work?</strong>
                        Connectra uses WebRTC with adaptive Opus 48kHz and VP8/VP9 video stream encoding with zero-latency signaling.
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 text-center">
                    <div className="font-bold text-slate-200">Connectra — Chat & Call</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">Version 2.4.0 (Production Build)</div>
                    <div className="text-[10px] text-cyan-400 mt-1">© 2026 Connectra Communication Labs</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* EDIT PROFILE MODAL */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm rounded-3xl border border-slate-800 bg-slate-900 p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-sm font-semibold text-white">Edit Profile</span>
              <button onClick={() => setIsEditingProfile(false)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSaveProfile} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Avatar Image URL</label>
                <input
                  type="text"
                  value={editAvatar}
                  onChange={(e) => setEditAvatar(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">About / Bio</label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 resize-none"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-xl bg-cyan-600 py-2.5 text-xs font-semibold text-white hover:bg-cyan-500"
              >
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      <QRCodeModal isOpen={showQRModal} onClose={() => setShowQRModal(false)} />

      {/* Admin Dashboard Modal */}
      <AdminDashboardModal isOpen={showAdminModal} onClose={() => setShowAdminModal(false)} />
    </div>
  );
};
