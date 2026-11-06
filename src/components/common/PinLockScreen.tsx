import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { BrandLogo } from './BrandLogo.tsx';
import { Lock, Delete } from 'lucide-react';

export const PinLockScreen: React.FC = () => {
  const { unlockApp } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      if (nextPin.length === 4) {
        setTimeout(() => {
          const success = unlockApp(nextPin);
          if (!success) {
            setError(true);
            setTimeout(() => {
              setPin('');
              setError(false);
            }, 600);
          }
        }, 100);
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-slate-950 p-6 text-white select-none">
      <div className="flex flex-col items-center mt-12">
        <BrandLogo size="lg" />
        <div className="mt-8 flex items-center gap-2 text-cyan-400">
          <Lock className="h-5 w-5" />
          <span className="text-sm font-semibold tracking-wide uppercase font-mono">App Locked</span>
        </div>
        <p className="mt-1 text-xs text-slate-400">Enter your 4-digit PIN to access Connectra</p>

        {/* 4 PIN Dots */}
        <div className={`mt-8 flex items-center gap-4 transition-transform ${error ? 'animate-shake' : ''}`}>
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-4 w-4 rounded-full border-2 transition-all duration-150 ${
                pin.length > i
                  ? 'border-cyan-400 bg-cyan-400 shadow-md shadow-cyan-400/50 scale-110'
                  : 'border-slate-700 bg-slate-900'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Numeric Keypad */}
      <div className="w-full max-w-xs mb-8">
        <div className="grid grid-cols-3 gap-4 text-center">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              onClick={() => handleDigit(num)}
              className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-slate-900 border border-slate-800 text-xl font-bold font-mono hover:bg-slate-800 active:scale-95 transition-all"
            >
              {num}
            </button>
          ))}
          <div />
          <button
            onClick={() => handleDigit('0')}
            className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-slate-900 border border-slate-800 text-xl font-bold font-mono hover:bg-slate-800 active:scale-95 transition-all"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="flex h-16 w-16 mx-auto items-center justify-center rounded-full text-slate-400 hover:text-white active:scale-95 transition-all"
          >
            <Delete className="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>
  );
};
