import React, { useState } from 'react';
import { UserStatus } from '../../types/index.ts';

interface AvatarProps {
  src?: string;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  status?: UserStatus;
  showStatus?: boolean;
  className?: string;
  onClick?: () => void;
}

const sizeClasses = {
  xs: 'w-7 h-7 text-xs',
  sm: 'w-9 h-9 text-xs',
  md: 'w-11 h-11 text-sm',
  lg: 'w-14 h-14 text-base font-semibold',
  xl: 'w-20 h-20 text-xl font-bold',
  '2xl': 'w-28 h-28 text-3xl font-bold',
};

const statusClasses = {
  online: 'bg-emerald-500 ring-slate-900',
  offline: 'bg-slate-500 ring-slate-900',
  busy: 'bg-rose-500 ring-slate-900',
  away: 'bg-amber-500 ring-slate-900',
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 'md',
  status,
  showStatus = false,
  className = '',
  onClick,
}) => {
  const [imageError, setImageError] = useState(false);

  const initials = name
    ? name
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  // Deterministic background gradient from name
  const gradients = [
    'from-cyan-600 to-blue-700',
    'from-teal-600 to-emerald-700',
    'from-sky-600 to-indigo-700',
    'from-blue-600 to-violet-700',
    'from-indigo-600 to-cyan-700',
  ];
  const charCodeSum = name ? name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) : 0;
  const gradient = gradients[charCodeSum % gradients.length];

  return (
    <div
      onClick={onClick}
      className={`relative inline-flex shrink-0 select-none items-center justify-center rounded-full ${
        sizeClasses[size]
      } ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {src && !imageError ? (
        <img
          src={src}
          alt={name}
          referrerPolicy="no-referrer"
          onError={() => setImageError(true)}
          className="h-full w-full rounded-full object-cover shadow-inner"
        />
      ) : (
        <div
          className={`flex h-full w-full items-center justify-center rounded-full bg-gradient-to-tr ${gradient} text-white font-medium`}
        >
          {initials}
        </div>
      )}

      {showStatus && status && (
        <span
          className={`absolute bottom-0 right-0 block rounded-full ring-2 ${
            size === 'xs' || size === 'sm' ? 'w-2.5 h-2.5 ring-1' : size === 'lg' || size === 'xl' ? 'w-4 h-4 ring-2' : 'w-3 h-3 ring-2'
          } ${statusClasses[status]}`}
          title={`Status: ${status}`}
        />
      )}
    </div>
  );
};
