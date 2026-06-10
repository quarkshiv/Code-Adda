import React from 'react';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
  name: string;
  color: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isOnline?: boolean;
  isTyping?: boolean;
  className?: string;
}

const sizeMap = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
};

const dotSizeMap = {
  xs: 'w-1.5 h-1.5 -bottom-0 -right-0',
  sm: 'w-2 h-2 bottom-0 right-0',
  md: 'w-2.5 h-2.5 bottom-0.5 right-0.5',
  lg: 'w-3 h-3 bottom-0.5 right-0.5',
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  name,
  color,
  size = 'md',
  isOnline = true,
  isTyping = false,
  className,
}) => {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={cn('relative inline-flex flex-shrink-0', className)}>
      <div
        className={cn(
          'rounded-full flex items-center justify-center font-bold select-none ring-2 ring-white/10',
          sizeMap[size]
        )}
        style={{ backgroundColor: color + '33', color, borderColor: color + '66', border: `2px solid ${color}66` }}
        title={name}
      >
        {initials}
      </div>
      {isOnline && (
        <span
          className={cn(
            'absolute rounded-full border-2 border-[#0D0D1A]',
            dotSizeMap[size],
            isTyping ? 'bg-yellow-400 animate-pulse' : 'bg-emerald-400'
          )}
        />
      )}
    </div>
  );
};
