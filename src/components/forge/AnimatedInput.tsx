'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { motion, type HTMLMotionProps } from 'framer-motion';

interface AnimatedInputProps extends Omit<HTMLMotionProps<'input'>, 'size'> {
  icon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function AnimatedInput({
  icon,
  size = 'md',
  className,
  ...props
}: AnimatedInputProps) {
  const sizeStyles = {
    sm: 'h-8 pl-8 pr-3 text-xs',
    md: 'h-10 pl-10 pr-4 text-sm',
    lg: 'h-12 pl-11 pr-5 text-sm',
  };

  return (
    <div className="relative w-full">
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#55556a] pointer-events-none">
          {icon}
        </div>
      )}
      <motion.input
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className={cn(
          'w-full rounded-lg bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)]',
          'text-[#f0f0f5] placeholder:text-[#55556a]',
          'focus:outline-none focus:border-[#8b5cf6]/50 focus:ring-1 focus:ring-[#8b5cf6]/20',
          'transition-all duration-200',
          sizeStyles[size],
          className
        )}
        {...props}
      />
    </div>
  );
}

interface AnimatedTextareaProps extends Omit<HTMLMotionProps<'textarea'>, 'size'> {
  size?: 'sm' | 'md' | 'lg';
}

export function AnimatedTextarea({
  size = 'md',
  className,
  ...props
}: AnimatedTextareaProps) {
  const sizeStyles = {
    sm: 'p-2 text-xs min-h-[60px]',
    md: 'p-3 text-sm min-h-[100px]',
    lg: 'p-4 text-sm min-h-[150px]',
  };

  return (
    <motion.textarea
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'w-full rounded-lg bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)]',
        'text-[#f0f0f5] placeholder:text-[#55556a] forge-code',
        'focus:outline-none focus:border-[#8b5cf6]/50 focus:ring-1 focus:ring-[#8b5cf6]/20',
        'transition-all duration-200 resize-none',
        sizeStyles[size],
        className
      )}
      {...props}
    />
  );
}