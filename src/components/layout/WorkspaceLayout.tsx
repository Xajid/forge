'use client';

import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useNavigationStore } from '@/stores/useNavigationStore';
import { GlowButton } from '@/components/forge/GlowButton';
import { TOOL_COLORS } from '@/lib/tools';
import { getTool } from '@/lib/tools';
import { ArrowLeft, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToolStore } from '@/stores/useToolStore';

interface WorkspaceLayoutProps {
  children: ReactNode;
  title?: string;
  actions?: ReactNode;
}

export function WorkspaceLayout({ children, title, actions }: WorkspaceLayoutProps) {
  const { currentView, goBack } = useNavigationStore();
  const { toggleFavorite, isFavorite } = useToolStore();
  const tool = currentView !== 'home' ? getTool(currentView as any) : undefined;
  const isFav = tool ? isFavorite(tool.id) : false;
  const colors = tool ? TOOL_COLORS[tool.color] : null;

  return (
    <div className="flex flex-col min-h-[calc(100vh-5rem)] pt-20 pb-8 px-4">
      <div className="mx-auto max-w-6xl w-full flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-6"
          >
            {/* Workspace header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {tool && colors && (
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: colors.bg, border: `1px solid ${colors.border}` }}
                  >
                    <span style={{ color: colors.text }}>
                      {tool.icon === 'Radio' && <span className="text-lg">📡</span>}
                      {tool.icon === 'Server' && <span className="text-lg">🖥</span>}
                      {tool.icon === 'GitBranch' && <span className="text-lg">🔀</span>}
                      {tool.icon === 'Flame' && <span className="text-lg">🔥</span>}
                      {tool.icon === 'CodeReview' && <span className="text-lg">🔍</span>}
                    </span>
                  </div>
                )}
                <div>
                  <h1 className="text-lg font-semibold text-[#f0f0f5]">
                    {title || tool?.name || 'Workspace'}
                  </h1>
                  <p className="text-xs text-[#55556a] mt-0.5">
                    {tool?.description}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {actions}
                {tool && (
                  <GlowButton
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleFavorite(tool.id)}
                    className="h-8 w-8"
                  >
                    <Star
                      className={`w-4 h-4 ${
                        isFav
                          ? 'text-[#facc15] fill-[#facc15]'
                          : 'text-[#55556a]'
                      }`}
                    />
                  </GlowButton>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1">{children}</div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}