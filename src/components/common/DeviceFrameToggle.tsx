import React from 'react';
import { Smartphone, Monitor, Moon, Sun } from 'lucide-react';

interface DeviceFrameToggleProps {
  isMobileFrame: boolean;
  onToggleFrame: (val: boolean) => void;
  isDarkMode: boolean;
  onToggleDark: (val: boolean) => void;
}

export const DeviceFrameToggle: React.FC<DeviceFrameToggleProps> = ({
  isMobileFrame,
  onToggleFrame,
  isDarkMode,
  onToggleDark,
}) => {
  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/90 p-1 backdrop-blur-md">
      <button
        onClick={() => onToggleFrame(false)}
        title="Desktop / Wide View"
        className={`flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors ${
          !isMobileFrame
            ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Monitor className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Desktop</span>
      </button>

      <button
        onClick={() => onToggleFrame(true)}
        title="Mobile Phone View (iOS/Android)"
        className={`flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors ${
          isMobileFrame
            ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Smartphone className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Phone Frame</span>
      </button>

      <div className="mx-1 h-4 w-px bg-slate-800" />

      <button
        onClick={() => onToggleDark(!isDarkMode)}
        title={isDarkMode ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
        className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
      >
        {isDarkMode ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
};
