import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Trash2, Send } from 'lucide-react';

interface VoiceRecorderProps {
  onSendAudio: (audioDataUrl: string, durationSeconds: number) => void;
  onCancel: () => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onSendAudio, onCancel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [volumeLevels, setVolumeLevels] = useState<number[]>([30, 50, 40, 70, 20]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    startRecording();
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
    }
  };

  const startRecording = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        // Setup Web Audio Analyser for live waveform visualization
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const audioCtx = new AudioCtx();
        const analyser = audioCtx.createAnalyser();
        const source = audioCtx.createMediaStreamSource(stream);
        analyser.fftSize = 64;
        source.connect(analyser);

        audioContextRef.current = audioCtx;
        analyserRef.current = analyser;

        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;
        audioChunksRef.current = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        recorder.onstop = () => {
          stream.getTracks().forEach((t) => t.stop());
        };

        recorder.start(100);
        setIsRecording(true);

        // Timer
        setDuration(0);
        timerRef.current = window.setInterval(() => {
          setDuration((d) => d + 1);
        }, 1000);

        // Waveform updater loop
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const updateWave = () => {
          analyser.getByteFrequencyData(dataArray);
          const sample = [
            Math.max(15, dataArray[2] / 2.5),
            Math.max(20, dataArray[6] / 2.2),
            Math.max(25, dataArray[10] / 2),
            Math.max(20, dataArray[14] / 2.3),
            Math.max(15, dataArray[18] / 2.7),
            Math.max(25, dataArray[22] / 2.1),
            Math.max(15, dataArray[26] / 2.8),
          ];
          setVolumeLevels(sample);
          animFrameRef.current = requestAnimationFrame(updateWave);
        };
        updateWave();
      } else {
        // Fallback simulation timer
        setIsRecording(true);
        timerRef.current = window.setInterval(() => {
          setDuration((d) => d + 1);
          setVolumeLevels(Array.from({ length: 7 }, () => Math.floor(20 + Math.random() * 60)));
        }, 1000);
      }
    } catch (err) {
      console.warn('Microphone permission not granted or unavailable:', err);
      // Run in simulated recording mode so user can still test voice note UX
      setIsRecording(true);
      timerRef.current = window.setInterval(() => {
        setDuration((d) => d + 1);
        setVolumeLevels(Array.from({ length: 7 }, () => Math.floor(20 + Math.random() * 60)));
      }, 1000);
    }
  };

  const handleFinish = async () => {
    cleanup();
    if (audioChunksRef.current.length > 0) {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Audio = reader.result as string;
        onSendAudio(base64Audio, Math.max(1, duration));
      };
      reader.readAsDataURL(audioBlob);
    } else {
      // Send simulated audio note
      onSendAudio('', Math.max(1, duration));
    }
  };

  const formatSecs = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex h-12 w-full items-center justify-between rounded-2xl border border-rose-500/30 bg-rose-950/20 px-3 py-1.5 backdrop-blur-md animate-in slide-in-from-bottom duration-150">
      <div className="flex items-center gap-2.5">
        <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-rose-500/20 text-rose-400">
          <Mic className="h-4 w-4 animate-pulse" />
          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-rose-500 animate-ping" />
        </div>
        <span className="text-xs font-mono font-medium text-rose-300 tabular-nums">
          {formatSecs(duration)}
        </span>

        {/* Live Audio Waves */}
        <div className="flex items-center gap-1 ml-2">
          {volumeLevels.map((lvl, idx) => (
            <span
              key={idx}
              className="w-1 rounded-full bg-rose-400 transition-all duration-75"
              style={{ height: `${Math.min(32, Math.max(6, lvl / 2.5))}px` }}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            cleanup();
            onCancel();
          }}
          title="Discard recording"
          className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:bg-slate-800 hover:text-rose-400 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </button>

        <button
          onClick={handleFinish}
          title="Send voice message"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-600 text-white shadow-md shadow-rose-600/30 hover:bg-rose-500 transition-transform active:scale-95"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
