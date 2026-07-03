'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { useNavigationStore } from '@/stores/useNavigationStore';
import { TOOLS, TOOL_COLORS } from '@/lib/tools';
import { GlowButton } from '@/components/forge/GlowButton';
import {
  Command,
  Search,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function FloatingNav() {
  const { currentView, goBack, openCommandPalette, navigate } = useNavigationStore();
  const currentTool = TOOLS.find((t) => t.id === currentView);
  const isHome = currentView === 'home';

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 left-0 right-0 z-40 px-4 pt-4"
    >
      <nav className="mx-auto max-w-5xl">
        <div className="forge-glass-strong rounded-2xl px-4 py-2.5 flex items-center gap-3">
          {/* Back button */}
          <AnimatePresence>
            {!isHome && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <GlowButton
                  variant="ghost"
                  size="icon"
                  onClick={goBack}
                  className="h-8 w-8"
                >
                  <ArrowLeft className="w-4 h-4" />
                </GlowButton>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Logo */}
          <button
            onClick={() => navigate('home')}
            className="flex items-center gap-2 mr-2 group"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#8b5cf6] to-[#3b82f6] flex items-center justify-center shadow-[0_0_12px_rgba(139,92,246,0.3)]">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-[#f0f0f5] tracking-tight hidden sm:inline">
              Forge
            </span>
          </button>

          {/* Current context */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2 flex-1 min-w-0"
            >
              {currentTool && (
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: TOOL_COLORS[currentTool.color].text }}
                  />
                  <span className="text-sm text-[#8888a0] truncate">
                    {currentTool.name}
                  </span>
                </div>
              )}
              {!isHome && !currentTool && (
                <span className="text-sm text-[#8888a0]">Forge</span>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Search trigger */}
          <button
            onClick={openCommandPalette}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] text-[#55556a] hover:border-[rgba(255,255,255,0.12)] hover:text-[#8888a0] transition-all duration-200 text-sm group"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Search</span>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono rounded bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.08)] text-[#55556a] ml-2 group-hover:text-[#8888a0]">
              ⌘K
            </kbd>
          </button>
        </div>
      </nav>
    </motion.header>
  );
}