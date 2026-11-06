import React, { useState } from 'react';
import { useCall } from '../../context/CallContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { Avatar } from '../common/Avatar.tsx';
import { User, CallRecord } from '../../types/index.ts';
import {
  Phone,
  Video,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Plus,
  Search,
  X,
} from 'lucide-react';

export const CallHistoryTab: React.FC = () => {
  const { callHistory, startCall } = useCall();
  const { allUsers, currentUser } = useAuth();

  const [filter, setFilter] = useState<'all' | 'missed'>('all');
  const [showNewCallModal, setShowNewCallModal] = useState(false);
  const [search, setSearch] = useState('');

  const formatDuration = (sec: number) => {
    if (!sec || sec === 0) return 'Missed';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s}s`;
  };

  const formatCallTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      const now = new Date();
      if (d.toDateString() === now.toDateString()) {
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  const getCallPeerUser = (record: CallRecord) => {
    const isCaller = record.callerId === currentUser?.id;
    const peerId = isCaller ? record.recipientIds[0] : record.callerId;
    return allUsers.find((u) => u.id === peerId);
  };

  const filteredHistory = callHistory.filter((c) => {
    if (filter === 'missed' && c.status !== 'missed') return false;
    return true;
  });

  return (
    <div className="flex h-full w-full flex-col bg-slate-900/90 backdrop-blur-md">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 px-4 py-3 bg-slate-950/60">
        <h2 className="text-base font-bold text-white tracking-tight">Calls</h2>
        <button
          onClick={() => setShowNewCallModal(true)}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-600 text-white hover:bg-cyan-500 shadow-sm transition-colors"
          title="Start New Call"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="p-3 border-b border-slate-800/60">
        <div className="flex items-center gap-1 rounded-lg bg-slate-950 p-1">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${
              filter === 'all'
                ? 'bg-cyan-500/20 text-cyan-300 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Calls ({callHistory.length})
          </button>
          <button
            onClick={() => setFilter('missed')}
            className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${
              filter === 'missed'
                ? 'bg-cyan-500/20 text-cyan-300 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Missed ({callHistory.filter((c) => c.status === 'missed').length})
          </button>
        </div>
      </div>

      {/* Call History List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40 p-2">
        {filteredHistory.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            No recent calls found.
          </div>
        ) : (
          filteredHistory.map((call) => {
            const peer = getCallPeerUser(call);
            const isMissed = call.status === 'missed' || call.direction === 'missed';
            const isIncoming = call.direction === 'incoming';

            return (
              <div
                key={call.id}
                className="flex items-center justify-between rounded-xl p-3 hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar
                    src={peer?.avatar}
                    name={peer?.name || 'Contact'}
                    size="md"
                    status={peer?.status}
                    showStatus
                  />

                  <div>
                    <div
                      className={`text-xs font-semibold ${
                        isMissed ? 'text-rose-400' : 'text-slate-100'
                      }`}
                    >
                      {peer?.name || 'Unknown Contact'}
                    </div>

                    <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                      {isMissed ? (
                        <PhoneMissed className="h-3 w-3 text-rose-500" />
                      ) : isIncoming ? (
                        <PhoneIncoming className="h-3 w-3 text-emerald-400" />
                      ) : (
                        <PhoneOutgoing className="h-3 w-3 text-cyan-400" />
                      )}
                      <span>{formatCallTime(call.startTime)}</span>
                      <span>·</span>
                      <span className="tabular-nums">{formatDuration(call.durationSeconds)}</span>
                    </div>
                  </div>
                </div>

                {/* Direct Call-back Action */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => peer && startCall(peer, 'audio')}
                    title="Audio Call"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-cyan-400 transition-colors"
                  >
                    <Phone className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => peer && startCall(peer, 'video')}
                    title="Video Call"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-cyan-400 transition-colors"
                  >
                    <Video className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Start New Call Modal */}
      {showNewCallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3.5 bg-slate-950/60">
              <span className="text-sm font-semibold text-white">Start New Call</span>
              <button
                onClick={() => setShowNewCallModal(false)}
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
              {allUsers
                .filter(
                  (u) =>
                    u.id !== currentUser?.id &&
                    (u.name.toLowerCase().includes(search.toLowerCase()) ||
                      u.phoneNumber.includes(search))
                )
                .map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between p-2.5 hover:bg-slate-800/50 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar src={u.avatar} name={u.name} size="sm" status={u.status} showStatus />
                      <div>
                        <div className="text-xs font-medium text-slate-200">{u.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{u.phoneNumber}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setShowNewCallModal(false);
                          startCall(u, 'audio');
                        }}
                        title="Start Voice Call"
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-cyan-400 hover:bg-slate-700"
                      >
                        <Phone className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setShowNewCallModal(false);
                          startCall(u, 'video');
                        }}
                        title="Start Video Call"
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-cyan-400 hover:bg-slate-700"
                      >
                        <Video className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
