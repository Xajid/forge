'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface ShimmerProps {
  className?: string;
  lines?: number;
}

export function Shimmer({ className, lines = 3 }: ShimmerProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.05 }}
          className="forge-shimmer h-4 rounded-md"
          style={{ width: `${100 - i * 15}%` }}
        />
      ))}
    </div>
  );
}

export function ShimmerCard({ className }: { className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        'forge-glass rounded-xl p-6 space-y-4',
        className
      )}
    >
      <div className="forge-shimmer h-5 w-1/3 rounded-md" />
      <div className="forge-shimmer h-4 w-full rounded-md" />
      <div className="forge-shimmer h-4 w-2/3 rounded-md" />
      <div className="flex gap-2 pt-2">
        <div className="forge-shimmer h-8 w-20 rounded-md" />
        <div className="forge-shimmer h-8 w-20 rounded-md" />
      </div>
    </motion.div>
  );
}