import React, { useRef, useEffect, useState } from 'react';
import { useCall } from '../../context/CallContext.tsx';
import { Avatar } from '../common/Avatar.tsx';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
  PhoneOff,
  SwitchCamera,
  Maximize2,
  Minimize2,
  ShieldCheck,
  Signal,
  Users,
} from 'lucide-react';

export const ActiveCallModal: React.FC = () => {
  const {
    activeCall,
    localStream,
    remoteStream,
    groupParticipants,
    endCall,
    toggleMute,
    toggleCamera,
    toggleSpeaker,
    flipCamera,
  } = useCall();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Attach local media stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, activeCall?.isCameraOff]);

  // Attach remote WebRTC stream to video and audio elements
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, activeCall?.status]);

  if (!activeCall) return null;

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const isVideo = activeCall.type === 'video';
  const isGroup = activeCall.isGroup;

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white animate-in fade-in duration-200"
    >
      {/* Top Header Bar */}
      <div className="flex h-16 items-center justify-between px-6 z-20 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-2 text-xs text-cyan-300 font-medium">
          <ShieldCheck className="h-4 w-4 text-cyan-400" />
          <span>E2EE · WebRTC HD Voice</span>
          <span className="text-slate-500">·</span>
          <div className="flex items-center gap-1 font-mono text-emerald-400 tabular-nums">
            <Signal className="h-3 w-3" />
            <span>34ms</span>
          </div>
        </div>

        <button
          onClick={toggleFullscreen}
          className="flex h-8 w-8 items-center justify-center rounded-full text-slate-300 hover:bg-white/10"
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </button>
      </div>

      {/* Main Call Stage */}
      <div className="relative flex-1 flex flex-col items-center justify-center overflow-hidden">
        {/* GROUP CALL MODE */}
        {isGroup ? (
          <div className="w-full h-full p-4 grid grid-cols-2 gap-3 max-w-4xl">
            {/* My own tile */}
            <div className="relative rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center">
              {!activeCall.isCameraOff && localStream ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center">
                  <Avatar name="You" size="lg" />
                  <span className="text-xs text-slate-400 mt-2">You (Camera off)</span>
                </div>
              )}
              <div className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-0.5 text-[11px] font-medium backdrop-blur-sm">
                You {activeCall.isMuted ? '🔇' : ''}
              </div>
            </div>

            {/* Other Group Peers */}
            {groupParticipants.map((peer) => (
              <div
                key={peer.id}
                className={`relative rounded-2xl bg-slate-900 border overflow-hidden flex flex-col items-center justify-center transition-all ${
                  peer.isSpeaking ? 'border-cyan-400 ring-2 ring-cyan-500/30' : 'border-slate-800'
                }`}
              >
                <Avatar src={peer.avatar} name={peer.name} size="lg" />
                <span className="text-xs text-slate-200 font-medium mt-2">{peer.name}</span>
                <div className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-0.5 text-[11px] font-medium backdrop-blur-sm flex items-center gap-1">
                  <span>{peer.name}</span>
                  {peer.isSpeaking && (
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : isVideo ? (
          /* 1-on-1 VIDEO CALL MODE */
          <div className="relative h-full w-full flex items-center justify-center">
            {/* Remote Video Stream / Fallback */}
            <div className="relative h-full w-full flex items-center justify-center bg-slate-900 overflow-hidden">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="h-full w-full object-cover"
              />

              {/* In case remote video track is off/inactive, show avatar backdrop */}
              {(!remoteStream || remoteStream.getVideoTracks().length === 0) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950">
                  <Avatar
                    src={activeCall.remoteUser.avatar}
                    name={activeCall.remoteUser.name}
                    size="2xl"
                    className="shadow-2xl ring-4 ring-cyan-500/30 mb-4"
                  />
                  <div className="text-sm font-semibold text-slate-200">
                    {activeCall.remoteUser.name}
                  </div>
                  <div className="text-xs text-slate-500 font-mono mt-1">Connecting video stream...</div>
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />

              {/* Status overlay */}
              <div className="absolute top-8 text-center z-10 pointer-events-none">
                <h2 className="text-xl font-bold tracking-tight text-white drop-shadow">
                  {activeCall.remoteUser.name}
                </h2>
                <p className="text-xs font-mono text-cyan-300 tabular-nums drop-shadow mt-1">
                  {activeCall.status === 'ringing'
                    ? 'Ringing...'
                    : activeCall.status === 'connected'
                    ? formatDuration(activeCall.durationSeconds)
                    : 'Call Ended'}
                </p>
                {activeCall.iceState && (
                  <div className="text-[10px] text-emerald-400 font-mono mt-0.5">
                    WebRTC: {activeCall.iceState}
                  </div>
                )}
              </div>
            </div>

            {/* Local Video PiP (Picture in Picture) */}
            <div className="absolute top-6 right-6 h-36 w-28 sm:h-48 sm:w-36 rounded-2xl overflow-hidden border-2 border-white/20 bg-slate-900 shadow-2xl z-20">
              {!activeCall.isCameraOff && localStream ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-slate-950 text-slate-400 text-xs">
                  Camera off
                </div>
              )}
              <div className="absolute bottom-1 right-1 rounded bg-black/60 px-1 text-[9px] text-white">
                You
              </div>
            </div>
          </div>
        ) : (
          /* 1-on-1 AUDIO CALL MODE */
          <div className="flex flex-col items-center justify-center text-center p-6">
            <div className="relative my-6 flex h-36 w-36 items-center justify-center">
              {/* Animated audio ripple waves */}
              {activeCall.status === 'connected' && (
                <>
                  <span className="absolute inset-0 rounded-full bg-cyan-500/20 animate-ping duration-1000" />
                  <span className="absolute -inset-4 rounded-full bg-cyan-500/10 animate-pulse duration-700" />
                  <span className="absolute -inset-8 rounded-full bg-cyan-500/5 animate-pulse duration-500" />
                </>
              )}
              <Avatar
                src={activeCall.remoteUser.avatar}
                name={activeCall.remoteUser.name}
                size="2xl"
                className="relative z-10 shadow-2xl ring-4 ring-cyan-500/30"
              />
            </div>

            <h2 className="text-2xl font-bold text-white tracking-tight">
              {activeCall.remoteUser.name}
            </h2>

            <div className="mt-2 text-sm font-mono text-cyan-400 tabular-nums">
              {activeCall.status === 'ringing'
                ? 'Calling...'
                : activeCall.status === 'connected'
                ? formatDuration(activeCall.durationSeconds)
                : 'Call Ended'}
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
              <span>HD Audio Opus 48kHz</span>
              <span>·</span>
              <span className="text-emerald-400">Connected</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Control Bar */}
      <div className="flex h-28 items-center justify-center gap-4 px-6 z-20 bg-gradient-to-t from-black/90 to-transparent">
        {/* Mute Mic */}
        <button
          onClick={toggleMute}
          title={activeCall.isMuted ? 'Unmute' : 'Mute'}
          className={`flex h-12 w-12 items-center justify-center rounded-full transition-transform active:scale-95 ${
            activeCall.isMuted
              ? 'bg-rose-500 text-white'
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          {activeCall.isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </button>

        {/* Video Camera Toggle */}
        {isVideo && (
          <>
            <button
              onClick={toggleCamera}
              title={activeCall.isCameraOff ? 'Turn Camera On' : 'Turn Camera Off'}
              className={`flex h-12 w-12 items-center justify-center rounded-full transition-transform active:scale-95 ${
                activeCall.isCameraOff
                  ? 'bg-rose-500 text-white'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {activeCall.isCameraOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
            </button>

            {/* Flip Camera */}
            <button
              onClick={flipCamera}
              title="Flip Front / Rear Camera"
              className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-transform active:scale-95"
            >
              <SwitchCamera className="h-5 w-5" />
            </button>
          </>
        )}

        {/* Speakerphone Toggle */}
        <button
          onClick={toggleSpeaker}
          title={activeCall.isSpeakerOn ? 'Speakerphone On' : 'Speakerphone Off'}
          className={`flex h-12 w-12 items-center justify-center rounded-full transition-transform active:scale-95 ${
            activeCall.isSpeakerOn
              ? 'bg-cyan-600 text-white'
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          {activeCall.isSpeakerOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
        </button>

        {/* End Call Button */}
        <button
          onClick={endCall}
          title="End Call"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-600 text-white shadow-xl shadow-rose-600/50 hover:bg-rose-500 active:scale-95 transition-transform"
        >
          <PhoneOff className="h-6 w-6" />
        </button>
      </div>

      {/* Hidden audio element for receiving remote peer audio */}
      <audio ref={remoteAudioRef} autoPlay playsInline />
    </div>
  );
};
