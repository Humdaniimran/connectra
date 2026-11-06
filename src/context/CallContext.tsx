import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { CallRecord, User } from '../types/index.ts';
import { socket } from '../services/socket.ts';
import { soundEffects } from '../services/audioTones.ts';
import { useAuth } from './AuthContext.tsx';
import { api } from '../services/api.ts';

export interface ActiveCallState {
  callId: string;
  type: 'audio' | 'video';
  isIncoming: boolean;
  status: 'ringing' | 'connected' | 'ended';
  remoteUser: {
    id: string;
    name: string;
    avatar: string;
  };
  chatId?: string;
  durationSeconds: number;
  isMuted: boolean;
  isCameraOff: boolean;
  isSpeakerOn: boolean;
  facingMode: 'user' | 'environment';
  isGroup?: boolean;
  iceState?: string;
}

export interface GroupCallParticipant {
  id: string;
  name: string;
  avatar: string;
  isMuted: boolean;
  isCameraOff: boolean;
  isSpeaking: boolean;
}

interface CallContextType {
  activeCall: ActiveCallState | null;
  incomingCall: ActiveCallState | null;
  callHistory: CallRecord[];
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  groupParticipants: GroupCallParticipant[];
  startCall: (recipient: User, type: 'audio' | 'video', chatId?: string) => Promise<void>;
  startGroupCall: (chatId: string, groupName: string) => Promise<void>;
  acceptCall: () => Promise<void>;
  rejectCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleCamera: () => void;
  toggleSpeaker: () => void;
  flipCamera: () => void;
  refreshCallHistory: () => Promise<void>;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export const CallProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser, allUsers } = useAuth();
  const [activeCall, setActiveCall] = useState<ActiveCallState | null>(null);
  const [incomingCall, setIncomingCall] = useState<ActiveCallState | null>(null);
  const [callHistory, setCallHistory] = useState<CallRecord[]>([]);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [groupParticipants, setGroupParticipants] = useState<GroupCallParticipant[]>([]);

  // WebRTC refs
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const incomingOfferRef = useRef<RTCSessionDescriptionInit | null>(null);

  const callTimerRef = useRef<number | null>(null);
  const durationRef = useRef<number>(0);

  const refreshCallHistory = async () => {
    try {
      const records = await api.getCalls();
      setCallHistory(records);
    } catch (e) {
      console.error('Failed to fetch call history:', e);
    }
  };

  useEffect(() => {
    refreshCallHistory();
  }, []);

  // Timer loop for call duration
  useEffect(() => {
    if (activeCall && activeCall.status === 'connected') {
      durationRef.current = 0;
      callTimerRef.current = window.setInterval(() => {
        durationRef.current += 1;
        setActiveCall((prev) => (prev ? { ...prev, durationSeconds: durationRef.current } : null));
      }, 1000);
    } else {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
        callTimerRef.current = null;
      }
    }
    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
        callTimerRef.current = null;
      }
    };
  }, [activeCall?.status]);

  // Generate synthetic stream if hardware camera/mic is restricted in sandbox
  const createSyntheticMediaStream = (type: 'audio' | 'video'): MediaStream => {
    const stream = new MediaStream();

    try {
      // Synthetic Audio Track using Web Audio API
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      gain.gain.value = 0.001; // subtle audible carrier
      osc.connect(gain);
      const dest = ctx.createMediaStreamDestination();
      gain.connect(dest);
      osc.start();
      dest.stream.getAudioTracks().forEach((track) => stream.addTrack(track));
    } catch (e) {
      console.warn('Could not generate synthetic audio track:', e);
    }

    if (type === 'video') {
      try {
        // Synthetic Video Track using HTML Canvas
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 480;
        const ctx2d = canvas.getContext('2d');
        if (ctx2d) {
          let hue = 0;
          const drawFrame = () => {
            hue = (hue + 1) % 360;
            ctx2d.fillStyle = `hsl(${hue}, 40%, 15%)`;
            ctx2d.fillRect(0, 0, canvas.width, canvas.height);
            ctx2d.fillStyle = '#38bdf8';
            ctx2d.font = '24px sans-serif';
            ctx2d.textAlign = 'center';
            ctx2d.fillText('Connectra HD Video Stream', 320, 220);
            ctx2d.fillStyle = '#94a3b8';
            ctx2d.font = '16px monospace';
            ctx2d.fillText(new Date().toLocaleTimeString(), 320, 260);
          };
          setInterval(drawFrame, 100);
          const canvasStream = canvas.captureStream(25);
          canvasStream.getVideoTracks().forEach((track) => stream.addTrack(track));
        }
      } catch (e) {
        console.warn('Could not generate synthetic video track:', e);
      }
    }

    return stream;
  };

  // Setup media stream (real hardware with fallback)
  const initLocalMedia = async (type: 'audio' | 'video', facingMode: 'user' | 'environment' = 'user') => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: type === 'video' ? { facingMode } : false,
        });
        setLocalStream(stream);
        return stream;
      }
    } catch (err) {
      console.warn('Hardware media device unavailable, using synthetic WebRTC media stream:', err);
    }
    const synthetic = createSyntheticMediaStream(type);
    setLocalStream(synthetic);
    return synthetic;
  };

  const stopLocalMedia = () => {
    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop());
      setLocalStream(null);
    }
    if (remoteStream) {
      remoteStream.getTracks().forEach((t) => t.stop());
      setRemoteStream(null);
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    pendingCandidatesRef.current = [];
    incomingOfferRef.current = null;
  };

  // Helper to create & configure RTCPeerConnection
  const setupPeerConnection = (targetUserId: string, callId: string, currentLocalStream: MediaStream) => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    const pc = new RTCPeerConnection(RTC_CONFIG);
    pcRef.current = pc;

    // Attach local tracks
    currentLocalStream.getTracks().forEach((track) => {
      pc.addTrack(track, currentLocalStream);
    });

    // Remote stream receiver
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      } else {
        const newStream = new MediaStream([event.track]);
        setRemoteStream(newStream);
      }
    };

    // ICE candidate discovery
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.send('call:signal', {
          toUserId: targetUserId,
          callId,
          signalData: {
            type: 'candidate',
            candidate: event.candidate,
          },
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      setActiveCall((prev) => (prev ? { ...prev, iceState: pc.iceConnectionState } : null));
    };

    return pc;
  };

  // Listen to WebSocket call events
  useEffect(() => {
    const unsubIncoming = (payload: any) => {
      // Don't interrupt if already on a call
      if (activeCall) {
        socket.send('call:reject', {
          callerId: payload.callerId,
          callId: payload.callId,
          reason: 'busy',
        });
        return;
      }

      if (payload.offer) {
        incomingOfferRef.current = payload.offer;
      }

      const incState: ActiveCallState = {
        callId: payload.callId,
        type: payload.type,
        isIncoming: true,
        status: 'ringing',
        remoteUser: {
          id: payload.callerId,
          name: payload.callerName,
          avatar: payload.callerAvatar,
        },
        chatId: payload.chatId,
        durationSeconds: 0,
        isMuted: false,
        isCameraOff: false,
        isSpeakerOn: true,
        facingMode: 'user',
        isGroup: payload.isGroup,
      };

      setIncomingCall(incState);
      soundEffects.startIncomingRingtone();
    };

    const unsubSignal = async (payload: any) => {
      const { signalData, fromUserId } = payload;
      if (!signalData) return;

      if (signalData.type === 'offer') {
        incomingOfferRef.current = signalData.sdp;
      } else if (signalData.type === 'answer') {
        if (pcRef.current) {
          try {
            await pcRef.current.setRemoteDescription(new RTCSessionDescription(signalData.sdp));
            // Drain pending ICE candidates
            while (pendingCandidatesRef.current.length > 0) {
              const candidate = pendingCandidatesRef.current.shift();
              if (candidate) {
                await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
              }
            }
          } catch (e) {
            console.error('Failed to set remote answer description:', e);
          }
        }
      } else if (signalData.type === 'candidate') {
        if (pcRef.current && pcRef.current.remoteDescription) {
          try {
            await pcRef.current.addIceCandidate(new RTCIceCandidate(signalData.candidate));
          } catch (e) {
            console.error('Failed to add ICE candidate:', e);
          }
        } else {
          pendingCandidatesRef.current.push(signalData.candidate);
        }
      }
    };

    const unsubRinging = () => {
      setActiveCall((prev) => (prev ? { ...prev, status: 'ringing' } : null));
    };

    const unsubAccepted = async (payload: any) => {
      soundEffects.stopOutgoingRingback();
      soundEffects.playCallConnected();
      setActiveCall((prev) => (prev ? { ...prev, status: 'connected' } : null));

      // As caller, initiate WebRTC Offer
      if (pcRef.current && activeCall) {
        try {
          const offer = await pcRef.current.createOffer();
          await pcRef.current.setLocalDescription(offer);
          socket.send('call:signal', {
            toUserId: payload.recipientId || activeCall.remoteUser.id,
            callId: activeCall.callId,
            signalData: {
              type: 'offer',
              sdp: offer,
            },
          });
        } catch (e) {
          console.error('Failed to create WebRTC offer:', e);
        }
      }
    };

    const unsubRejected = () => {
      soundEffects.stopOutgoingRingback();
      soundEffects.playCallEnded();
      setActiveCall((prev) => (prev ? { ...prev, status: 'ended' } : null));
      setTimeout(() => {
        setActiveCall(null);
        stopLocalMedia();
        refreshCallHistory();
      }, 1500);
    };

    const unsubEnded = () => {
      soundEffects.stopIncomingRingtone();
      soundEffects.stopOutgoingRingback();
      soundEffects.playCallEnded();
      setActiveCall((prev) => (prev ? { ...prev, status: 'ended' } : null));
      setIncomingCall(null);
      setTimeout(() => {
        setActiveCall(null);
        stopLocalMedia();
        refreshCallHistory();
      }, 1200);
    };

    const unsubGroupJoined = (payload: any) => {
      setGroupParticipants((prev) => {
        if (prev.some((p) => p.id === payload.user.id)) return prev;
        return [...prev, payload.user];
      });
    };

    const unsubGroupLeft = (payload: any) => {
      setGroupParticipants((prev) => prev.filter((p) => p.id !== payload.userId));
    };

    const un1 = socket.on('call:incoming', unsubIncoming);
    const un2 = socket.on('call:signal', unsubSignal);
    const un3 = socket.on('call:ringing', unsubRinging);
    const un4 = socket.on('call:accepted', unsubAccepted);
    const un5 = socket.on('call:rejected', unsubRejected);
    const un6 = socket.on('call:ended', unsubEnded);
    const un7 = socket.on('group_call:participant_joined', unsubGroupJoined);
    const un8 = socket.on('group_call:participant_left', unsubGroupLeft);

    return () => {
      un1();
      un2();
      un3();
      un4();
      un5();
      un6();
      un7();
      un8();
    };
  }, [activeCall, localStream]);

  // Initiate an Outgoing Call
  const startCall = async (recipient: User, type: 'audio' | 'video', chatId?: string) => {
    if (!currentUser) return;
    const callId = 'call_' + Date.now();

    const stream = await initLocalMedia(type);

    // Setup WebRTC peer connection
    setupPeerConnection(recipient.id, callId, stream);

    const callState: ActiveCallState = {
      callId,
      type,
      isIncoming: false,
      status: 'ringing',
      remoteUser: {
        id: recipient.id,
        name: recipient.name,
        avatar: recipient.avatar,
      },
      chatId,
      durationSeconds: 0,
      isMuted: false,
      isCameraOff: false,
      isSpeakerOn: true,
      facingMode: 'user',
    };

    setActiveCall(callState);
    soundEffects.startOutgoingRingback();

    socket.send('call:initiate', {
      callId,
      callerId: currentUser.id,
      callerName: currentUser.name,
      callerAvatar: currentUser.avatar,
      recipientId: recipient.id,
      chatId,
      type,
    });
  };

  // Start Group Audio/Video Conference
  const startGroupCall = async (chatId: string, groupName: string) => {
    if (!currentUser) return;
    const callId = 'grp_call_' + Date.now();

    const stream = await initLocalMedia('video');

    const callState: ActiveCallState = {
      callId,
      type: 'video',
      isIncoming: false,
      status: 'connected',
      remoteUser: {
        id: 'group',
        name: groupName,
        avatar: '',
      },
      chatId,
      durationSeconds: 0,
      isMuted: false,
      isCameraOff: false,
      isSpeakerOn: true,
      facingMode: 'user',
      isGroup: true,
    };

    setActiveCall(callState);
    soundEffects.playCallConnected();

    // Add active group users as initial participants
    const mockPeers: GroupCallParticipant[] = allUsers
      .filter((u) => u.id !== currentUser.id && u.id !== 'user_alex')
      .slice(0, 3)
      .map((u) => ({
        id: u.id,
        name: u.name,
        avatar: u.avatar,
        isMuted: false,
        isCameraOff: false,
        isSpeaking: Math.random() > 0.5,
      }));

    setGroupParticipants(mockPeers);

    socket.send('group_call:join', {
      chatId,
      user: {
        id: currentUser.id,
        name: currentUser.name,
        avatar: currentUser.avatar,
        isMuted: false,
        isCameraOff: false,
        isSpeaking: false,
      },
    });
  };

  // Accept incoming call
  const acceptCall = async () => {
    if (!incomingCall || !currentUser) return;
    soundEffects.stopIncomingRingtone();
    soundEffects.playCallConnected();

    const stream = await initLocalMedia(incomingCall.type);

    const callerId = incomingCall.remoteUser.id;
    const pc = setupPeerConnection(callerId, incomingCall.callId, stream);

    const connectedState: ActiveCallState = {
      ...incomingCall,
      status: 'connected',
    };

    setActiveCall(connectedState);
    setIncomingCall(null);

    // Notify caller of acceptance
    socket.send('call:accept', {
      callId: incomingCall.callId,
      callerId,
      recipientId: currentUser.id,
    });

    // If offer already received, create Answer
    if (incomingOfferRef.current) {
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(incomingOfferRef.current));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.send('call:signal', {
          toUserId: callerId,
          callId: incomingCall.callId,
          signalData: {
            type: 'answer',
            sdp: answer,
          },
        });
        // Drain candidates
        while (pendingCandidatesRef.current.length > 0) {
          const candidate = pendingCandidatesRef.current.shift();
          if (candidate) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          }
        }
      } catch (e) {
        console.error('Failed to create WebRTC answer:', e);
      }
    }
  };

  // Reject incoming call
  const rejectCall = () => {
    if (!incomingCall || !currentUser) return;
    soundEffects.stopIncomingRingtone();

    socket.send('call:reject', {
      callId: incomingCall.callId,
      callerId: incomingCall.remoteUser.id,
      recipientId: currentUser.id,
      type: incomingCall.type,
      reason: 'declined',
    });

    setIncomingCall(null);
  };

  // End active call
  const endCall = () => {
    if (!activeCall) return;
    soundEffects.stopOutgoingRingback();
    soundEffects.stopIncomingRingtone();
    soundEffects.playCallEnded();

    if (activeCall.isGroup && activeCall.chatId && currentUser) {
      socket.send('group_call:leave', { chatId: activeCall.chatId, userId: currentUser.id });
    } else {
      socket.send('call:end', {
        callId: activeCall.callId,
        callerId: activeCall.isIncoming ? activeCall.remoteUser.id : currentUser?.id,
        recipientId: activeCall.isIncoming ? currentUser?.id : activeCall.remoteUser.id,
        durationSeconds: durationRef.current,
        type: activeCall.type,
      });
    }

    setActiveCall({ ...activeCall, status: 'ended' });
    setTimeout(() => {
      setActiveCall(null);
      stopLocalMedia();
      refreshCallHistory();
    }, 800);
  };

  // Toggle Mute
  const toggleMute = () => {
    if (!activeCall) return;
    const newMuted = !activeCall.isMuted;
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !newMuted;
      });
    }
    setActiveCall({ ...activeCall, isMuted: newMuted });
  };

  // Toggle Camera
  const toggleCamera = () => {
    if (!activeCall) return;
    const newCameraOff = !activeCall.isCameraOff;
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !newCameraOff;
      });
    }
    setActiveCall({ ...activeCall, isCameraOff: newCameraOff });
  };

  // Toggle Speaker
  const toggleSpeaker = () => {
    if (!activeCall) return;
    setActiveCall({ ...activeCall, isSpeakerOn: !activeCall.isSpeakerOn });
  };

  // Flip Front/Rear camera
  const flipCamera = async () => {
    if (!activeCall || activeCall.type !== 'video') return;
    const newFacing = activeCall.facingMode === 'user' ? 'environment' : 'user';
    stopLocalMedia();
    const newStream = await initLocalMedia('video', newFacing);
    if (pcRef.current && newStream) {
      const videoTrack = newStream.getVideoTracks()[0];
      const sender = pcRef.current.getSenders().find((s) => s.track && s.track.kind === 'video');
      if (sender && videoTrack) {
        sender.replaceTrack(videoTrack).catch(() => {});
      }
    }
    setActiveCall({ ...activeCall, facingMode: newFacing });
  };

  return (
    <CallContext.Provider
      value={{
        activeCall,
        incomingCall,
        callHistory,
        localStream,
        remoteStream,
        groupParticipants,
        startCall,
        startGroupCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleMute,
        toggleCamera,
        toggleSpeaker,
        flipCamera,
        refreshCallHistory,
      }}
    >
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error('useCall must be used within a CallProvider');
  return ctx;
};
