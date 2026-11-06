import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { ChatProvider, useChat } from './context/ChatContext.tsx';
import { CallProvider, useCall } from './context/CallContext.tsx';
import { BrandLogo } from './components/common/BrandLogo.tsx';
import { DeviceFrameToggle } from './components/common/DeviceFrameToggle.tsx';
import { Avatar } from './components/common/Avatar.tsx';
import { PinLockScreen } from './components/common/PinLockScreen.tsx';

import { ChatList } from './components/chat/ChatList.tsx';
import { ChatWindow } from './components/chat/ChatWindow.tsx';
import { NewGroupModal } from './components/chat/NewGroupModal.tsx';
import { ContactsModal } from './components/contacts/ContactsModal.tsx';

import { StatusTab } from './components/status/StatusTab.tsx';
import { CallHistoryTab } from './components/calls/CallHistoryTab.tsx';
import { CommunitiesTab } from './components/communities/CommunitiesTab.tsx';
import { SettingsTab } from './components/settings/SettingsTab.tsx';

import { IncomingCallNotification } from './components/calls/IncomingCallNotification.tsx';
import { ActiveCallModal } from './components/calls/ActiveCallModal.tsx';
import { AuthModal } from './components/auth/AuthModal.tsx';
import { NotificationToast } from './components/common/NotificationToast.tsx';

import {
  MessageSquare,
  Sparkles,
  Phone,
  Radio,
  Settings,
  Users,
  ShieldCheck,
} from 'lucide-react';

type NavTab = 'chats' | 'updates' | 'calls' | 'communities' | 'settings';

function MainApp() {
  const { currentUser, isLocked, isLoading } = useAuth();
  const {
    activeChat,
    chats,
    incomingNotification,
    dismissNotification,
    setActiveChat,
  } = useChat();
  const { callHistory } = useCall();

  const [currentTab, setCurrentTab] = useState<NavTab>('chats');
  const [isMobileFrame, setIsMobileFrame] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Modals
  const [showContactsModal, setShowContactsModal] = useState(false);
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <BrandLogo size="lg" />
          <span className="text-xs text-cyan-400 font-mono animate-pulse">
            Connecting to Connectra Network...
          </span>
        </div>
      </div>
    );
  }

  if (isLocked) {
    return <PinLockScreen />;
  }

  // Count unread chats
  const totalUnreadChats = chats.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
  const missedCallsCount = callHistory.filter((c) => c.status === 'missed').length;

  const renderActiveTabContent = () => {
    switch (currentTab) {
      case 'chats':
        return (
          <ChatList
            onOpenNewChat={() => setShowContactsModal(true)}
            onOpenNewGroup={() => setShowNewGroupModal(true)}
          />
        );
      case 'updates':
        return <StatusTab />;
      case 'calls':
        return <CallHistoryTab />;
      case 'communities':
        return <CommunitiesTab />;
      case 'settings':
        return <SettingsTab />;
      default:
        return null;
    }
  };

  return (
    <div
      className={`relative flex h-screen w-screen flex-col overflow-hidden font-sans transition-colors ${
        isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'
      }`}
    >
      {/* GLOBAL TOP BAR CONTRACT */}
      <header className="flex h-14 shrink-0 items-center justify-between gap-8 border-b border-slate-800/80 bg-slate-950/90 px-4 sm:px-6 backdrop-blur-md z-30">
        {/* Zone 1: Single Brand wordmark */}
        <div className="flex items-center gap-3 whitespace-nowrap shrink-0">
          <BrandLogo size="md" />
        </div>

        {/* Zone 2: Navigation Links / Breadcrumb */}
        <div className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-400">
          <button
            onClick={() => setCurrentTab('chats')}
            className={`transition-colors whitespace-nowrap hover:text-white ${
              currentTab === 'chats' ? 'text-cyan-400 font-bold' : ''
            }`}
          >
            Chats {totalUnreadChats > 0 ? `(${totalUnreadChats})` : ''}
          </button>
          <button
            onClick={() => setCurrentTab('updates')}
            className={`transition-colors whitespace-nowrap hover:text-white ${
              currentTab === 'updates' ? 'text-cyan-400 font-bold' : ''
            }`}
          >
            Status Stories
          </button>
          <button
            onClick={() => setCurrentTab('calls')}
            className={`transition-colors whitespace-nowrap hover:text-white ${
              currentTab === 'calls' ? 'text-cyan-400 font-bold' : ''
            }`}
          >
            Calls {missedCallsCount > 0 ? `(${missedCallsCount} missed)` : ''}
          </button>
          <button
            onClick={() => setCurrentTab('communities')}
            className={`transition-colors whitespace-nowrap hover:text-white ${
              currentTab === 'communities' ? 'text-cyan-400 font-bold' : ''
            }`}
          >
            Communities
          </button>
        </div>

        {/* Zone 3: Device Frame Switcher & User Persona CTA */}
        <div className="flex items-center gap-3 shrink-0">
          <DeviceFrameToggle
            isMobileFrame={isMobileFrame}
            onToggleFrame={setIsMobileFrame}
            isDarkMode={isDarkMode}
            onToggleDark={setIsDarkMode}
          />

          {currentUser ? (
            <button
              onClick={() => setShowAuthModal(true)}
              title="Switch user account"
              className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/90 py-1 px-2 hover:border-slate-700 transition-colors"
            >
              <Avatar src={currentUser.avatar} name={currentUser.name} size="xs" status={currentUser.status} showStatus />
              <span className="hidden sm:inline text-xs font-semibold text-slate-200">
                {currentUser.name.split(' ')[0]}
              </span>
            </button>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="rounded-xl bg-cyan-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow hover:bg-cyan-500 transition-colors whitespace-nowrap"
            >
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <div className="flex flex-1 overflow-hidden items-center justify-center">
        {/* If Mobile Phone Frame preview is toggled */}
        {isMobileFrame ? (
          <div className="my-auto h-[820px] w-[390px] rounded-[48px] border-[10px] border-slate-800 bg-slate-950 shadow-2xl overflow-hidden flex flex-col relative ring-1 ring-white/10">
            {/* Dynamic Island / Notch */}
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 h-5 w-24 rounded-full bg-slate-900 z-40 flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-slate-950 mr-2" />
              <div className="h-1.5 w-1.5 rounded-full bg-cyan-500/40" />
            </div>

            {/* Phone Screen Body */}
            <div className="flex-1 flex flex-col pt-7 overflow-hidden">
              {activeChat && currentTab === 'chats' ? (
                <ChatWindow />
              ) : (
                <div className="flex-1 overflow-hidden flex flex-col">
                  {renderActiveTabContent()}
                </div>
              )}
            </div>

            {/* Mobile Bottom Navigation Tab Bar */}
            {(!activeChat || currentTab !== 'chats') && (
              <div className="grid grid-cols-5 items-center h-16 border-t border-slate-800/80 bg-slate-950/95 backdrop-blur-md px-1 shrink-0 z-30">
                <button
                  onClick={() => setCurrentTab('chats')}
                  className={`flex flex-col items-center justify-center min-h-[44px] ${
                    currentTab === 'chats' ? 'text-cyan-400 font-semibold' : 'text-slate-400'
                  }`}
                >
                  <div className="relative">
                    <MessageSquare className="h-5 w-5" />
                    {totalUnreadChats > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-cyan-500 text-[9px] font-bold text-slate-950">
                        {totalUnreadChats}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] tracking-tight mt-0.5">Chats</span>
                </button>

                <button
                  onClick={() => setCurrentTab('updates')}
                  className={`flex flex-col items-center justify-center min-h-[44px] ${
                    currentTab === 'updates' ? 'text-cyan-400 font-semibold' : 'text-slate-400'
                  }`}
                >
                  <Sparkles className="h-5 w-5" />
                  <span className="text-[10px] tracking-tight mt-0.5">Status</span>
                </button>

                <button
                  onClick={() => setCurrentTab('calls')}
                  className={`flex flex-col items-center justify-center min-h-[44px] ${
                    currentTab === 'calls' ? 'text-cyan-400 font-semibold' : 'text-slate-400'
                  }`}
                >
                  <div className="relative">
                    <Phone className="h-5 w-5" />
                    {missedCallsCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
                        {missedCallsCount}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] tracking-tight mt-0.5">Calls</span>
                </button>

                <button
                  onClick={() => setCurrentTab('communities')}
                  className={`flex flex-col items-center justify-center min-h-[44px] ${
                    currentTab === 'communities' ? 'text-cyan-400 font-semibold' : 'text-slate-400'
                  }`}
                >
                  <Radio className="h-5 w-5" />
                  <span className="text-[10px] tracking-tight mt-0.5">Channels</span>
                </button>

                <button
                  onClick={() => setCurrentTab('settings')}
                  className={`flex flex-col items-center justify-center min-h-[44px] ${
                    currentTab === 'settings' ? 'text-cyan-400 font-semibold' : 'text-slate-400'
                  }`}
                >
                  <Settings className="h-5 w-5" />
                  <span className="text-[10px] tracking-tight mt-0.5">Settings</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          /* RESPONSIVE FULL DESKTOP / TABLET MULTI-PANE VIEW */
          <div className="flex h-full w-full max-w-full overflow-hidden">
            {/* Desktop Left Navigation Rail */}
            <div className="hidden lg:flex w-18 shrink-0 flex-col items-center justify-between border-r border-slate-800/80 bg-slate-950/95 py-5 z-20">
              <div className="flex flex-col items-center gap-6">
                <button
                  onClick={() => setCurrentTab('chats')}
                  title="Chats"
                  className={`relative flex h-11 w-11 items-center justify-center rounded-2xl transition-all ${
                    currentTab === 'chats'
                      ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <MessageSquare className="h-5 w-5" />
                  {totalUnreadChats > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-cyan-400 px-1 text-[10px] font-bold text-slate-950 font-mono">
                      {totalUnreadChats}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setCurrentTab('updates')}
                  title="Status Updates"
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl transition-all ${
                    currentTab === 'updates'
                      ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <Sparkles className="h-5 w-5" />
                </button>

                <button
                  onClick={() => setCurrentTab('calls')}
                  title="Call Logs"
                  className={`relative flex h-11 w-11 items-center justify-center rounded-2xl transition-all ${
                    currentTab === 'calls'
                      ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <Phone className="h-5 w-5" />
                  {missedCallsCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white font-mono">
                      {missedCallsCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setCurrentTab('communities')}
                  title="Communities & Channels"
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl transition-all ${
                    currentTab === 'communities'
                      ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <Radio className="h-5 w-5" />
                </button>
              </div>

              <div className="flex flex-col items-center gap-4">
                <button
                  onClick={() => setCurrentTab('settings')}
                  title="Settings"
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl transition-all ${
                    currentTab === 'settings'
                      ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <Settings className="h-5 w-5" />
                </button>

                <button
                  onClick={() => setShowAuthModal(true)}
                  title="Switch Profile"
                  className="rounded-full ring-2 ring-slate-800 hover:ring-cyan-500 transition-all"
                >
                  <Avatar src={currentUser?.avatar} name={currentUser?.name || 'User'} size="sm" />
                </button>
              </div>
            </div>

            {/* Middle Pane (List View) */}
            <div
              className={`h-full w-full lg:w-96 shrink-0 flex flex-col overflow-hidden border-r border-slate-800 ${
                activeChat && currentTab === 'chats' ? 'hidden lg:flex' : 'flex'
              }`}
            >
              {renderActiveTabContent()}
            </div>

            {/* Right Pane (Chat Window or Placeholder) */}
            <div
              className={`h-full flex-1 flex flex-col overflow-hidden ${
                !activeChat && currentTab === 'chats' ? 'hidden lg:flex' : 'flex'
              }`}
            >
              {currentTab === 'chats' ? (
                <ChatWindow />
              ) : (
                <div className="hidden lg:flex h-full flex-1 flex-col items-center justify-center bg-slate-950 p-8 text-center select-none">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400 mb-4 border border-cyan-500/20">
                    <ShieldCheck className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-bold text-white capitalize">{currentTab} Active</h3>
                  <p className="mt-1 text-xs text-slate-400 max-w-sm">
                    Navigate your conversations, update your status, manage community channels, or configure encryption keys from the sidebar.
                  </p>
                </div>
              )}
            </div>

            {/* Mobile Bottom Navigation (Visible only on small viewports) */}
            {(!activeChat || currentTab !== 'chats') && (
              <div className="lg:hidden fixed bottom-0 left-0 right-0 grid grid-cols-5 items-center h-16 border-t border-slate-800/80 bg-slate-950/95 backdrop-blur-md px-1 z-30">
                <button
                  onClick={() => setCurrentTab('chats')}
                  className={`flex flex-col items-center justify-center min-h-[44px] ${
                    currentTab === 'chats' ? 'text-cyan-400 font-semibold' : 'text-slate-400'
                  }`}
                >
                  <div className="relative">
                    <MessageSquare className="h-5 w-5" />
                    {totalUnreadChats > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-cyan-500 text-[9px] font-bold text-slate-950">
                        {totalUnreadChats}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] tracking-tight mt-0.5">Chats</span>
                </button>

                <button
                  onClick={() => setCurrentTab('updates')}
                  className={`flex flex-col items-center justify-center min-h-[44px] ${
                    currentTab === 'updates' ? 'text-cyan-400 font-semibold' : 'text-slate-400'
                  }`}
                >
                  <Sparkles className="h-5 w-5" />
                  <span className="text-[10px] tracking-tight mt-0.5">Status</span>
                </button>

                <button
                  onClick={() => setCurrentTab('calls')}
                  className={`flex flex-col items-center justify-center min-h-[44px] ${
                    currentTab === 'calls' ? 'text-cyan-400 font-semibold' : 'text-slate-400'
                  }`}
                >
                  <div className="relative">
                    <Phone className="h-5 w-5" />
                    {missedCallsCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
                        {missedCallsCount}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] tracking-tight mt-0.5">Calls</span>
                </button>

                <button
                  onClick={() => setCurrentTab('communities')}
                  className={`flex flex-col items-center justify-center min-h-[44px] ${
                    currentTab === 'communities' ? 'text-cyan-400 font-semibold' : 'text-slate-400'
                  }`}
                >
                  <Radio className="h-5 w-5" />
                  <span className="text-[10px] tracking-tight mt-0.5">Channels</span>
                </button>

                <button
                  onClick={() => setCurrentTab('settings')}
                  className={`flex flex-col items-center justify-center min-h-[44px] ${
                    currentTab === 'settings' ? 'text-cyan-400 font-semibold' : 'text-slate-400'
                  }`}
                >
                  <Settings className="h-5 w-5" />
                  <span className="text-[10px] tracking-tight mt-0.5">Settings</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* OVERLAY CALL, AUTH & NOTIFICATION TOASTS */}
      <NotificationToast
        notification={incomingNotification}
        onDismiss={dismissNotification}
        onOpen={() => {
          if (incomingNotification) {
            const target = chats.find((c) => c.id === incomingNotification.message.chatId);
            if (target) {
              setActiveChat(target);
              setCurrentTab('chats');
            }
            dismissNotification();
          }
        }}
      />
      <IncomingCallNotification />
      <ActiveCallModal />
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      <ContactsModal isOpen={showContactsModal} onClose={() => setShowContactsModal(false)} />
      <NewGroupModal isOpen={showNewGroupModal} onClose={() => setShowNewGroupModal(false)} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <CallProvider>
          <MainApp />
        </CallProvider>
      </ChatProvider>
    </AuthProvider>
  );
}
