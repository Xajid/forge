'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: 'blue' | 'purple' | 'cyan' | 'none';
  hover?: boolean;
  gradient?: boolean;
}

export function GlassCard({
  children,
  className,
  glow = 'none',
  hover = false,
  gradient = false,
  ...props
}: GlassCardProps) {
  const glowMap = {
    blue: 'hover:shadow-[0_0_30px_rgba(59,130,246,0.1)]',
    purple: 'hover:shadow-[0_0_30px_rgba(139,92,246,0.1)]',
    cyan: 'hover:shadow-[0_0_30px_rgba(6,182,212,0.1)]',
    none: '',
  };

  return (
    <motion.div
      whileHover={hover ? { y: -2, scale: 1.005 } : undefined}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={cn(
        'forge-glass rounded-xl',
        gradient && 'forge-gradient-border',
        hover && 'cursor-pointer transition-all duration-200',
        glowMap[glow],
        className
      )}
      {...(props as React.ComponentProps<typeof motion.div>)}
    >
      {children}
    </motion.div>
  );
}

export function GlassCardStatic({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('forge-glass rounded-xl', className)}
      {...props}
    >
      {children}
    </div>
  );
}