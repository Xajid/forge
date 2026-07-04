'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface GradientBorderProps {
  children: React.ReactNode;
  className?: string;
  animated?: boolean;
  color?: 'default' | 'blue' | 'purple' | 'cyan';
}

const colorMap = {
  default:
    'linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(59, 130, 246, 0.3), rgba(6, 182, 212, 0.1))',
  blue: 'linear-gradient(135deg, rgba(59, 130, 246, 0.4), rgba(6, 182, 212, 0.2))',
  purple: 'linear-gradient(135deg, rgba(139, 92, 246, 0.4), rgba(168, 85, 247, 0.2))',
  cyan: 'linear-gradient(135deg, rgba(6, 182, 212, 0.4), rgba(59, 130, 246, 0.2))',
};

export function GradientBorder({
  children,
  className,
  animated = false,
  color = 'default',
}: GradientBorderProps) {
  return (
    <div className={cn('relative rounded-xl', animated && 'forge-gradient-border-animated', className)}>
      <div
        className="absolute inset-0 rounded-xl p-px pointer-events-none"
        style={{
          background: colorMap[color],
          ...(animated
            ? {
                backgroundSize: '300% 300%',
                animation: 'gradient-shift 4s ease infinite',
              }
            : {}),
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
        }}
      />
      {children}
    </div>
  );
}