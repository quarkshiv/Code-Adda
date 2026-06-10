import React from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  gradient?: boolean;
  hover?: boolean;
  onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className,
  glow = false,
  gradient = false,
  hover = false,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-2xl border border-white/10 backdrop-blur-xl',
        'bg-white/5',
        glow && 'shadow-[0_0_40px_rgba(124,58,237,0.15)]',
        gradient && 'bg-gradient-to-br from-white/8 to-white/3',
        hover && 'cursor-pointer transition-all duration-300 hover:border-purple-500/40 hover:bg-white/8 hover:shadow-[0_0_30px_rgba(168,85,247,0.2)] hover:scale-[1.02]',
        className
      )}
    >
      {children}
    </div>
  );
};
