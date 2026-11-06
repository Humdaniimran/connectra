import React from 'react';
import { useCall } from '../../context/CallContext.tsx';
import { Avatar } from '../common/Avatar.tsx';
import { Phone, Video, PhoneOff, Check } from 'lucide-react';

export const IncomingCallNotification: React.FC = () => {
  const { incomingCall, acceptCall, rejectCall } = useCall();

  if (!incomingCall) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
      <div className="relative w-full max-w-sm rounded-3xl border border-cyan-500/30 bg-slate-900/90 p-6 text-center shadow-2xl backdrop-blur-md">
        {/* Animated Pulse Rings around Avatar */}
        <div className="relative mx-auto my-4 flex h-28 w-28 items-center justify-center">
          <span className="absolute inset-0 rounded-full bg-cyan-500/20 animate-ping" />
          <span className="absolute -inset-3 rounded-full bg-cyan-500/10 animate-pulse" />
          <Avatar
            src={incomingCall.remoteUser.avatar}
            name={incomingCall.remoteUser.name}
            size="xl"
            className="relative z-10 shadow-xl ring-4 ring-cyan-500/40"
          />
        </div>

        <h3 className="text-xl font-bold text-white tracking-tight">
          {incomingCall.remoteUser.name}
        </h3>
        <p className="mt-1 flex items-center justify-center gap-1.5 text-xs text-cyan-300 font-medium">
          {incomingCall.type === 'video' ? (
            <>
              <Video className="h-4 w-4 text-cyan-400" />
              <span>Incoming HD Video Call</span>
            </>
          ) : (
            <>
              <Phone className="h-4 w-4 text-cyan-400" />
              <span>Incoming Voice Call</span>
            </>
          )}
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex items-center justify-around px-4">
          {/* Decline */}
          <div className="flex flex-col items-center gap-1.5">
            <button
              onClick={rejectCall}
              title="Decline Call"
              className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-600 text-white shadow-lg shadow-rose-600/40 hover:bg-rose-500 active:scale-95 transition-transform"
            >
              <PhoneOff className="h-6 w-6" />
            </button>
            <span className="text-[11px] text-slate-400 font-medium">Decline</span>
          </div>

          {/* Accept */}
          <div className="flex flex-col items-center gap-1.5">
            <button
              onClick={acceptCall}
              title="Accept Call"
              className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/40 hover:bg-emerald-400 active:scale-95 transition-transform animate-bounce duration-1000"
            >
              <Check className="h-7 w-7" />
            </button>
            <span className="text-[11px] text-emerald-400 font-medium">Accept</span>
          </div>
        </div>
      </div>
    </div>
  );
};
