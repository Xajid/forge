'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'blue' | 'purple' | 'cyan' | 'success' | 'warning' | 'destructive';
  className?: string;
}

const variantStyles: Record<NonNullable<BadgeProps['variant']>, string> = {
  default: 'bg-[rgba(255,255,255,0.06)] text-[#8888a0] border-[rgba(255,255,255,0.06)]',
  blue: 'bg-[rgba(59,130,246,0.1)] text-[#60a5fa] border-[rgba(59,130,246,0.2)]',
  purple: 'bg-[rgba(139,92,246,0.1)] text-[#a78bfa] border-[rgba(139,92,246,0.2)]',
  cyan: 'bg-[rgba(6,182,212,0.1)] text-[#22d3ee] border-[rgba(6,182,212,0.2)]',
  success: 'bg-[rgba(34,197,94,0.1)] text-[#4ade80] border-[rgba(34,197,94,0.2)]',
  warning: 'bg-[rgba(234,179,8,0.1)] text-[#facc15] border-[rgba(234,179,8,0.2)]',
  destructive: 'bg-[rgba(239,68,68,0.1)] text-[#f87171] border-[rgba(239,68,68,0.2)]',
};

export function ForgeBadge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-md border',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

interface MethodBadgeProps {
  method: string;
  className?: string;
}

const methodColors: Record<string, string> = {
  GET: 'bg-[rgba(34,197,94,0.1)] text-[#4ade80] border-[rgba(34,197,94,0.2)]',
  POST: 'bg-[rgba(59,130,246,0.1)] text-[#60a5fa] border-[rgba(59,130,246,0.2)]',
  PUT: 'bg-[rgba(234,179,8,0.1)] text-[#facc15] border-[rgba(234,179,8,0.2)]',
  PATCH: 'bg-[rgba(234,179,8,0.1)] text-[#facc15] border-[rgba(234,179,8,0.2)]',
  DELETE: 'bg-[rgba(239,68,68,0.1)] text-[#f87171] border-[rgba(239,68,68,0.2)]',
  HEAD: 'bg-[rgba(139,92,246,0.1)] text-[#a78bfa] border-[rgba(139,92,246,0.2)]',
  OPTIONS: 'bg-[rgba(139,92,246,0.1)] text-[#a78bfa] border-[rgba(139,92,246,0.2)]',
};

export function MethodBadge({ method, className }: MethodBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 text-xs font-bold rounded-md border font-mono',
        methodColors[method] || methodColors.GET,
        className
      )}
    >
      {method}
    </span>
  );
}

interface StatusBadgeProps {
  status: number;
  className?: string;
}

function getStatusStyle(status: number): string {
  if (status >= 200 && status < 300) return 'bg-[rgba(34,197,94,0.1)] text-[#4ade80] border-[rgba(34,197,94,0.2)]';
  if (status >= 300 && status < 400) return 'bg-[rgba(59,130,246,0.1)] text-[#60a5fa] border-[rgba(59,130,246,0.2)]';
  if (status >= 400 && status < 500) return 'bg-[rgba(234,179,8,0.1)] text-[#facc15] border-[rgba(234,179,8,0.2)]';
  return 'bg-[rgba(239,68,68,0.1)] text-[#f87171] border-[rgba(239,68,68,0.2)]';
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 text-xs font-bold rounded-md border font-mono',
        getStatusStyle(status),
        className
      )}
    >
      {status}
    </span>
  );
}