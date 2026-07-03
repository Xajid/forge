'use client';

import React from 'react';
import { useNavigationStore } from '@/stores/useNavigationStore';
import { useToolStore } from '@/stores/useToolStore';
import { TOOLS, TOOL_COLORS, getToolsByCategory } from '@/lib/tools';
import { GlassCard } from '@/components/forge/GlassCard';
import { GlowButton } from '@/components/forge/GlowButton';
import { GradientBorder } from '@/components/forge/GradientBorder';
import { ForgeBadge } from '@/components/forge/ForgeBadge';
import { motion } from 'framer-motion';
import {
  Radio,
  Server,
  GitBranch,
  Flame,
  GitPullRequest,
  Star,
  Clock,
  Sparkles,
  ArrowRight,
  Zap,
  Shield,
} from 'lucide-react';
import { ToolId } from '@/lib/types';

const toolIcons: Record<string, React.ReactNode> = {
  Radio: <Radio className="w-5 h-5" />,
  Server: <Server className="w-5 h-5" />,
  GitBranch: <GitBranch className="w-5 h-5" />,
  Flame: <Flame className="w-5 h-5" />,
  CodeReview: <GitPullRequest className="w-5 h-5" />,
};

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

export function HomePage() {
  const { navigate } = useNavigationStore();
  const { favorites, recentTools, toggleFavorite, isFavorite } = useToolStore();
  const aiTools = getToolsByCategory('ai');
  const devTools = getToolsByCategory('testing');

  const handleOpenTool = (id: ToolId) => {
    const tool = TOOLS.find(t => t.id === id);
    if (tool) {
      useToolStore.getState().addRecentTool(id, tool.name);
    }
    navigate(id);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero section */}
      <section className="pt-24 pb-12 px-4 relative">
        <div className="absolute inset-0 forge-glow pointer-events-none" />
        <div className="absolute inset-0 forge-noise pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 max-w-5xl mx-auto text-center"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[rgba(139,92,246,0.1)] border border-[rgba(139,92,246,0.2)] mb-6"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#a78bfa]" />
            <span className="text-xs font-medium text-[#a78bfa]">Premium Developer Toolkit</span>
          </motion.div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
            <span className="text-[#f0f0f5]">Build with </span>
            <span className="forge-text-gradient">precision</span>
          </h1>
          <p className="text-base sm:text-lg text-[#8888a0] max-w-2xl mx-auto leading-relaxed">
            A carefully curated set of tools that solve real engineering problems.
            Fast, elegant, and built for developers who demand excellence.
          </p>

          {/* Quick search */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="mt-8 max-w-md mx-auto"
          >
            <GradientBorder color="purple">
              <button
                onClick={() => useNavigationStore.getState().openCommandPalette()}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-[rgba(255,255,255,0.03)] text-left group"
              >
                <Zap className="w-4 h-4 text-[#55556a] group-hover:text-[#a78bfa] transition-colors" />
                <span className="text-sm text-[#55556a] group-hover:text-[#8888a0] transition-colors flex-1">
                  Search tools, navigate, or run actions...
                </span>
                <kbd className="px-2 py-0.5 text-[10px] font-mono rounded-md bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.08)] text-[#55556a]">
                  ⌘K
                </kbd>
              </button>
            </GradientBorder>
          </motion.div>
        </motion.div>
      </section>

      {/* Recent tools */}
      {recentTools.length > 0 && (
        <section className="px-4 pb-8">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-[#55556a]" />
              <h2 className="text-sm font-medium text-[#8888a0]">Continue Working</h2>
            </div>
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="flex gap-3 overflow-x-auto pb-2 forge-scrollbar"
            >
              {recentTools.slice(0, 5).map((recent) => {
                const tool = TOOLS.find(t => t.id === recent.id);
                if (!tool) return null;
                const colors = TOOL_COLORS[tool.color];
                return (
                  <motion.button
                    key={recent.id}
                    variants={item}
                    onClick={() => handleOpenTool(tool.id)}
                    className="shrink-0 flex items-center gap-3 px-4 py-3 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.12)] transition-all duration-200 group text-left"
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: colors.bg, color: colors.text }}
                    >
                      {toolIcons[tool.icon]}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm text-[#f0f0f5] group-hover:text-white transition-colors truncate max-w-[160px]">
                        {tool.name}
                      </div>
                      <div className="text-xs text-[#55556a]">
                        {new Date(recent.accessedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[#333348] group-hover:text-[#8888a0] transition-colors shrink-0" />
                  </motion.button>
                );
              })}
            </motion.div>
          </div>
        </section>
      )}

      {/* Favorites */}
      {favorites.length > 0 && (
        <section className="px-4 pb-8">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-4 h-4 text-[#facc15] fill-[#facc15]" />
              <h2 className="text-sm font-medium text-[#8888a0]">Favorites</h2>
            </div>
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
            >
              {favorites.map((favId) => {
                const tool = TOOLS.find(t => t.id === favId);
                if (!tool) return null;
                const colors = TOOL_COLORS[tool.color];
                return (
                  <motion.div key={favId} variants={item}>
                    <GlassCard
                      hover
                      glow={tool.color}
                      className="p-4 cursor-pointer"
                      onClick={() => handleOpenTool(tool.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                            style={{ backgroundColor: colors.bg, color: colors.text }}
                          >
                            {toolIcons[tool.icon]}
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-[#f0f0f5]">{tool.name}</h3>
                            <p className="text-xs text-[#55556a] mt-0.5 line-clamp-1">{tool.description}</p>
                          </div>
                        </div>
                        <Star className="w-3.5 h-3.5 text-[#facc15] fill-[#facc15] shrink-0 mt-1" />
                      </div>
                    </GlassCard>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>
      )}

      {/* AI Tools */}
      <section className="px-4 pb-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-[#a78bfa]" />
            <h2 className="text-sm font-medium text-[#8888a0]">AI-Powered Tools</h2>
          </div>
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
          >
            {aiTools.map((tool) => {
              const colors = TOOL_COLORS[tool.color];
              const fav = isFavorite(tool.id);
              return (
                <motion.div key={tool.id} variants={item}>
                  <GlassCard
                    hover
                    glow={tool.color}
                    className="p-5 cursor-pointer"
                    onClick={() => handleOpenTool(tool.id)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: colors.bg, color: colors.text }}
                      >
                        {toolIcons[tool.icon]}
                      </div>
                      <div className="flex items-center gap-1">
                        <ForgeBadge variant="purple" className="text-[10px]">AI</ForgeBadge>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(tool.id);
                          }}
                          className="p-1 rounded hover:bg-[rgba(255,255,255,0.06)] transition-colors"
                        >
                          <Star
                            className={`w-3.5 h-3.5 ${
                              fav ? 'text-[#facc15] fill-[#facc15]' : 'text-[#333348]'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                    <h3 className="text-sm font-semibold text-[#f0f0f5] mb-1">{tool.name}</h3>
                    <p className="text-xs text-[#55556a] leading-relaxed line-clamp-2">{tool.description}</p>
                  </GlassCard>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Developer Utilities */}
      <section className="px-4 pb-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-[#60a5fa]" />
            <h2 className="text-sm font-medium text-[#8888a0]">Developer Utilities</h2>
          </div>
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
          >
            {devTools.map((tool) => {
              const colors = TOOL_COLORS[tool.color];
              const fav = isFavorite(tool.id);
              return (
                <motion.div key={tool.id} variants={item}>
                  <GlassCard
                    hover
                    glow={tool.color}
                    className="p-5 cursor-pointer"
                    onClick={() => handleOpenTool(tool.id)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: colors.bg, color: colors.text }}
                      >
                        {toolIcons[tool.icon]}
                      </div>
                      <div className="flex items-center gap-1">
                        <ForgeBadge variant={tool.color === 'blue' ? 'blue' : 'cyan'} className="text-[10px]">
                          {tool.category === 'testing' ? 'TEST' : 'UTIL'}
                        </ForgeBadge>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(tool.id);
                          }}
                          className="p-1 rounded hover:bg-[rgba(255,255,255,0.06)] transition-colors"
                        >
                          <Star
                            className={`w-3.5 h-3.5 ${
                              fav ? 'text-[#facc15] fill-[#facc15]' : 'text-[#333348]'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                    <h3 className="text-sm font-semibold text-[#f0f0f5] mb-1">{tool.name}</h3>
                    <p className="text-xs text-[#55556a] leading-relaxed line-clamp-2">{tool.description}</p>
                  </GlassCard>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* All tools grid */}
      <section className="px-4 pb-12">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-[#22d3ee]" />
            <h2 className="text-sm font-medium text-[#8888a0]">All Tools</h2>
          </div>
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3"
          >
            {TOOLS.map((tool) => {
              const colors = TOOL_COLORS[tool.color];
              return (
                <motion.button
                  key={tool.id}
                  variants={item}
                  onClick={() => handleOpenTool(tool.id)}
                  className="flex flex-col items-center gap-3 p-5 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)] hover:border-[rgba(255,255,255,0.12)] hover:bg-[rgba(255,255,255,0.04)] transition-all duration-300 group text-center"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                    style={{ backgroundColor: colors.bg, color: colors.text }}
                  >
                    {toolIcons[tool.icon]}
                  </div>
                  <div>
                    <div className="text-xs font-medium text-[#f0f0f5] group-hover:text-white transition-colors">
                      {tool.name}
                    </div>
                    <div className="text-[10px] text-[#55556a] mt-0.5 capitalize">
                      {tool.category}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </motion.div>
        </div>
      </section>
    </div>
  );
}