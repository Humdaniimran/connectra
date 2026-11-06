import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
}) => {
  const iconSize = size === 'sm' ? 24 : size === 'lg' ? 44 : 32;

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div
        className="relative flex items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-600 via-sky-500 to-teal-400 p-0.5 shadow-md shadow-cyan-500/20"
        style={{ width: iconSize, height: iconSize }}
      >
        <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-slate-950">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="w-3/5 h-3/5 text-cyan-400"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Unique Connectra emblem: Interconnected conversational waves forming an infinity shield */}
            <path d="M7 11.5a4.5 4.5 0 0 1 8-2.5 4.5 4.5 0 0 1 2 4c0 3-3.5 5.5-6.5 7.5-3-2-6.5-4.5-6.5-7.5a4.5 4.5 0 0 1 3-4" />
            <path d="M12 7v5l3 2" />
          </svg>
        </div>
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className="font-bold tracking-tight text-white font-sans text-base leading-none">
            Connectra
          </span>
          <span className="text-[10px] tracking-widest uppercase font-mono text-cyan-400 font-medium mt-0.5">
            Chat & Call
          </span>
        </div>
      )}
    </div>
  );
};
