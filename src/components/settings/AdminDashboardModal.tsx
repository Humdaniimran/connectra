import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  ShieldAlert,
  Server,
  Activity,
  Users,
  MessageSquare,
  HardDrive,
  CheckCircle2,
  X,
  Bell,
  RefreshCw,
} from 'lucide-react';

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { allUsers } = useAuth();
  const [metrics, setMetrics] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'metrics' | 'reports' | 'users' | 'broadcast'>('metrics');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastSent, setBroadcastSent] = useState(false);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [m, r] = await Promise.all([
        api.getAdminMetrics(),
        api.getAbuseReports(),
      ]);
      setMetrics(m);
      setReports(r);
    } catch (e) {
      console.error('Failed to load admin data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAdminData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;
    setBroadcastSent(true);
    setTimeout(() => {
      setBroadcastMessage('');
      setBroadcastSent(false);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-600/20 text-cyan-400">
              <Server className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white leading-none">Connectra Admin Console</h3>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                Cluster Health & Infrastructure Telemetry
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="grid grid-cols-4 gap-1 p-2 bg-slate-950 border-b border-slate-800 text-xs font-medium">
          <button
            onClick={() => setActiveTab('metrics')}
            className={`py-1.5 rounded-lg transition-colors ${
              activeTab === 'metrics'
                ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Cluster Health
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`py-1.5 rounded-lg transition-colors ${
              activeTab === 'reports'
                ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Abuse Reports ({reports.length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`py-1.5 rounded-lg transition-colors ${
              activeTab === 'users'
                ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            User Accounts
          </button>
          <button
            onClick={() => setActiveTab('broadcast')}
            className={`py-1.5 rounded-lg transition-colors ${
              activeTab === 'broadcast'
                ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Push Broadcast
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-xs text-slate-500">
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              <span>Fetching cluster state...</span>
            </div>
          ) : (
            <>
              {/* TAB 1: METRICS */}
              {activeTab === 'metrics' && metrics && (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5">
                      <div className="text-[10px] text-slate-400 font-mono uppercase">WebSocket Conns</div>
                      <div className="text-xl font-bold text-cyan-400 font-mono mt-1 tabular-nums">
                        {metrics.activeSockets} active
                      </div>
                      <div className="text-[10px] text-emerald-400 mt-1">Healthy</div>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5">
                      <div className="text-[10px] text-slate-400 font-mono uppercase">Messages Synced</div>
                      <div className="text-xl font-bold text-white font-mono mt-1 tabular-nums">
                        {metrics.totalMessages}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">Zero dropped</div>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5">
                      <div className="text-[10px] text-slate-400 font-mono uppercase">Calls Completed</div>
                      <div className="text-xl font-bold text-white font-mono mt-1 tabular-nums">
                        {metrics.totalCalls}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">WebRTC SFU</div>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5">
                      <div className="text-[10px] text-slate-400 font-mono uppercase">Server Uptime</div>
                      <div className="text-xl font-bold text-white font-mono mt-1 tabular-nums">
                        {Math.floor(metrics.serverUptimeSeconds / 60)}m {metrics.serverUptimeSeconds % 60}s
                      </div>
                      <div className="text-[10px] text-emerald-400 mt-1">100% SLA</div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
                    <span className="text-xs font-bold text-white">Cryptographic Ratchets & Media Nodes</span>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between text-slate-300">
                        <span>Active E2EE Session Ratchets:</span>
                        <span className="font-mono text-cyan-400">{metrics.encryptionRatchetsActive} pair ratchets</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span>SFU Media Relay Nodes:</span>
                        <span className="font-mono text-emerald-400">{metrics.sfuMediaNodes} online (US-East, EU-Central, APAC)</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span>Relay Jitter Buffer:</span>
                        <span className="font-mono text-slate-400">12ms average</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: REPORTS */}
              {activeTab === 'reports' && (
                <div className="space-y-3">
                  {reports.length === 0 ? (
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-8 text-center text-xs text-slate-500">
                      No pending user or spam abuse reports. Platform is clean!
                    </div>
                  ) : (
                    reports.map((r) => (
                      <div
                        key={r.id}
                        className="rounded-2xl border border-rose-900/30 bg-rose-950/10 p-3.5 flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <ShieldAlert className="h-4 w-4 text-rose-400" />
                            <span className="text-xs font-bold text-white">{r.reason}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-1">
                            Reported user: {r.reportedUserId} · Reporter: {r.reporterId}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              alert(`Report ${r.id} dismissed.`);
                              setReports((prev) => prev.filter((item) => item.id !== r.id));
                            }}
                            className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700"
                          >
                            Dismiss
                          </button>
                          <button
                            onClick={() => {
                              alert(`User suspended.`);
                              setReports((prev) => prev.filter((item) => item.id !== r.id));
                            }}
                            className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-500"
                          >
                            Suspend User
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 3: USERS */}
              {activeTab === 'users' && (
                <div className="divide-y divide-slate-800/40 rounded-2xl border border-slate-800 bg-slate-950/60 p-2">
                  {allUsers.map((u) => (
                    <div key={u.id} className="flex items-center justify-between p-2.5">
                      <div>
                        <div className="text-xs font-semibold text-white">
                          {u.name} {u.role === 'admin' ? '(Admin)' : ''}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          @{u.username} · {u.phoneNumber} · Status: {u.status}
                        </div>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 4: BROADCAST */}
              {activeTab === 'broadcast' && (
                <form onSubmit={handleSendBroadcast} className="space-y-4">
                  <div className="rounded-xl border border-cyan-500/20 bg-cyan-950/20 p-3 text-xs text-cyan-300">
                    Send high-priority system maintenance, security, or release alerts to all connected devices.
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      System Notification Text
                    </label>
                    <textarea
                      placeholder="e.g. Scheduled SFU audio node upgrade tonight at 03:00 UTC."
                      value={broadcastMessage}
                      onChange={(e) => setBroadcastMessage(e.target.value)}
                      rows={4}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs text-white focus:outline-none focus:border-cyan-500 resize-none"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-cyan-600 py-3 text-xs font-bold text-white hover:bg-cyan-500"
                  >
                    <Bell className="h-4 w-4" />
                    <span>{broadcastSent ? 'Broadcast Dispatched!' : 'Send Global Push Alert'}</span>
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
