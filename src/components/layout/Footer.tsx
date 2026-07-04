'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Sparkles, Github, Twitter } from 'lucide-react';

export function Footer() {
  return (
    <footer className="mt-auto border-t border-[rgba(255,255,255,0.04)] py-4 px-6">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-[#55556a]">
          <div className="w-4 h-4 rounded bg-gradient-to-br from-[#8b5cf6] to-[#3b82f6] flex items-center justify-center">
            <Sparkles className="w-2.5 h-2.5 text-white" />
          </div>
          <span>Forge</span>
          <span className="text-[#333348]">·</span>
          <span>Premium Developer Toolkit</span>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="#"
            className="text-[#55556a] hover:text-[#8888a0] transition-colors"
            aria-label="GitHub"
          >
            <Github className="w-4 h-4" />
          </a>
          <a
            href="#"
            className="text-[#55556a] hover:text-[#8888a0] transition-colors"
            aria-label="Twitter"
          >
            <Twitter className="w-4 h-4" />
          </a>
        </div>
      </div>
    </footer>
  );
}