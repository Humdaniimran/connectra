import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { StatusUpdate } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { Avatar } from '../common/Avatar.tsx';
import { StatusViewerModal } from './StatusViewerModal.tsx';
import { CreateStatusModal } from './CreateStatusModal.tsx';
import { Plus, Sparkles, ShieldCheck, Eye } from 'lucide-react';

export const StatusTab: React.FC = () => {
  const { currentUser } = useAuth();
  const [statuses, setStatuses] = useState<StatusUpdate[]>([]);
  const [activeViewerStatuses, setActiveViewerStatuses] = useState<StatusUpdate[] | null>(null);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchStatuses = async () => {
    try {
      const list = await api.getStatuses();
      setStatuses(list);
    } catch (e) {
      console.error('Failed to load statuses:', e);
    }
  };

  useEffect(() => {
    fetchStatuses();
  }, []);

  const myStatuses = statuses.filter((s) => s.userId === currentUser?.id);
  const otherStatuses = statuses.filter((s) => s.userId !== currentUser?.id);

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

  const handleOpenStatus = (list: StatusUpdate[], idx = 0) => {
    setActiveViewerStatuses(list);
    setViewerIndex(idx);
  };

  return (
    <div className="flex h-full w-full flex-col bg-slate-900/90 backdrop-blur-md">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 px-4 py-3 bg-slate-950/60">
        <h2 className="text-base font-bold text-white tracking-tight">Status & Stories</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-600 text-white hover:bg-cyan-500 shadow-sm transition-colors"
          title="Add New Status"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* MY STATUS ROW */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5 flex items-center justify-between">
          <div
            className="flex items-center gap-3 cursor-pointer flex-1"
            onClick={() => {
              if (myStatuses.length > 0) {
                handleOpenStatus(myStatuses, 0);
              } else {
                setShowCreateModal(true);
              }
            }}
          >
            <div className="relative">
              <Avatar
                src={currentUser?.avatar}
                name={currentUser?.name || 'You'}
                size="md"
                className={myStatuses.length > 0 ? 'ring-2 ring-cyan-400 p-0.5' : ''}
              />
              {myStatuses.length === 0 && (
                <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-cyan-600 text-white shadow ring-2 ring-slate-950">
                  <Plus className="h-3 w-3 stroke-[3]" />
                </div>
              )}
            </div>

            <div>
              <div className="text-xs font-semibold text-white">My Status</div>
              <div className="text-[11px] text-slate-400">
                {myStatuses.length > 0
                  ? `${myStatuses.length} active status · ${formatTimeAgo(myStatuses[0].createdAt)}`
                  : 'Tap to add status update'}
              </div>
            </div>
          </div>

          {myStatuses.length > 0 && (
            <button
              onClick={() => handleOpenStatus(myStatuses, 0)}
              className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs text-cyan-300 hover:bg-slate-800"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>{myStatuses[0].viewers.length}</span>
            </button>
          )}
        </div>

        {/* RECENT UPDATES SECTION */}
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1 mb-2">
            Recent Updates ({otherStatuses.length})
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 divide-y divide-slate-800/40 overflow-hidden">
            {otherStatuses.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                No recent status updates from your contacts.
              </div>
            ) : (
              otherStatuses.map((s, idx) => (
                <div
                  key={s.id}
                  onClick={() => handleOpenStatus(otherStatuses, idx)}
                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative rounded-full ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-950 p-0.5">
                      <Avatar src={s.user.avatar} name={s.user.name} size="md" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-100">{s.user.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {formatTimeAgo(s.createdAt)}
                      </div>
                    </div>
                  </div>

                  <span className="text-[11px] text-cyan-400 font-medium hover:underline">
                    View
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Security & Expiration Info Note */}
        <div className="flex items-center gap-2 rounded-xl border border-cyan-500/20 bg-cyan-950/20 p-3 text-xs text-cyan-300/90">
          <ShieldCheck className="h-4 w-4 text-cyan-400 shrink-0" />
          <span>Status updates disappear automatically after 24 hours.</span>
        </div>
      </div>

      {/* Story Viewer Modal */}
      {activeViewerStatuses && (
        <StatusViewerModal
          statuses={activeViewerStatuses}
          initialIndex={viewerIndex}
          onClose={() => setActiveViewerStatuses(null)}
        />
      )}

      {/* Create Status Modal */}
      <CreateStatusModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={(newStatus) => {
          setStatuses((prev) => [newStatus, ...prev]);
        }}
      />
    </div>
  );
};
