import React, { useState } from 'react';
import { MapPin, Navigation, Send, X, Check } from 'lucide-react';

interface LocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendLocation: (loc: { latitude: number; longitude: number; address: string }) => void;
}

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  isOpen,
  onClose,
  onSendLocation,
}) => {
  const [address, setAddress] = useState('555 Mission St, San Francisco, CA 94105');
  const [coords, setCoords] = useState({ latitude: 37.7891, longitude: -122.3995 });
  const [isDetecting, setIsDetecting] = useState(false);

  if (!isOpen) return null;

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      setIsDetecting(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({
            latitude: parseFloat(pos.coords.latitude.toFixed(4)),
            longitude: parseFloat(pos.coords.longitude.toFixed(4)),
          });
          setAddress(`Current Location (${pos.coords.latitude.toFixed(2)}°, ${pos.coords.longitude.toFixed(2)}°)`);
          setIsDetecting(false);
        },
        () => {
          setIsDetecting(false);
        }
      );
    }
  };

  const handleSend = () => {
    onSendLocation({
      latitude: coords.latitude,
      longitude: coords.longitude,
      address,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3.5 bg-slate-950/60">
          <div className="flex items-center gap-2 text-white font-medium text-sm">
            <MapPin className="h-4 w-4 text-cyan-400" />
            <span>Share Location</span>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Mock Map Canvas */}
        <div className="relative h-48 w-full bg-slate-950 overflow-hidden flex items-center justify-center border-b border-slate-800">
          {/* Subtle Grid Map Background */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: 'radial-gradient(#38bdf8 1px, transparent 1px)',
              backgroundSize: '16px 16px',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />

          {/* Map Pin Marker */}
          <div className="relative flex flex-col items-center animate-bounce duration-1000">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/50">
              <MapPin className="h-5 w-5" />
            </div>
            <div className="h-2 w-2 rounded-full bg-cyan-400 ring-4 ring-cyan-500/30" />
          </div>

          {/* Quick GPS detect button */}
          <button
            type="button"
            onClick={handleGetCurrentLocation}
            className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/90 px-3 py-1.5 text-xs font-medium text-slate-200 shadow backdrop-blur-md hover:bg-slate-800"
          >
            <Navigation className={`h-3.5 w-3.5 text-cyan-400 ${isDetecting ? 'animate-spin' : ''}`} />
            <span>{isDetecting ? 'Locating...' : 'Use My GPS'}</span>
          </button>
        </div>

        {/* Address and Confirm */}
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Location Name / Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
            <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500 font-mono tabular-nums">
              <span>Lat: {coords.latitude}</span>
              <span>·</span>
              <span>Long: {coords.longitude}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-700 py-2.5 text-xs font-medium text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-cyan-600 py-2.5 text-xs font-semibold text-white shadow-md shadow-cyan-600/20 hover:bg-cyan-500"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Share in Chat</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
