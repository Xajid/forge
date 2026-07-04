'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { motion, type HTMLMotionProps } from 'framer-motion';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

interface GlowButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  glow?: boolean;
  children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-[#8b5cf6] to-[#3b82f6] text-white hover:from-[#7c3aed] hover:to-[#2563eb] shadow-[0_0_20px_rgba(139,92,246,0.2)]',
  secondary:
    'bg-[rgba(255,255,255,0.06)] text-[#f0f0f5] hover:bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.06)]',
  ghost:
    'text-[#8888a0] hover:text-[#f0f0f5] hover:bg-[rgba(255,255,255,0.06)]',
  destructive:
    'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20',
  outline:
    'text-[#f0f0f5] border border-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.04)]',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-9 px-4 text-sm gap-2',
  lg: 'h-11 px-6 text-sm gap-2',
  icon: 'h-9 w-9',
};

export function GlowButton({
  variant = 'primary',
  size = 'md',
  glow = true,
  children,
  className,
  disabled,
  ...props
}: GlowButtonProps) {
  return (
    <motion.button
      whileHover={disabled ? undefined : { scale: 1.02 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      transition={{ duration: 0.15 }}
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b5cf6]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#06060b]',
        'disabled:opacity-50 disabled:pointer-events-none',
        variantStyles[variant],
        sizeStyles[size],
        glow && variant === 'primary' && 'forge-glow-button',
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </motion.button>
  );
}