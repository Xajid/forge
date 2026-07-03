'use client';

import React, { useEffect, useCallback, useMemo } from 'react';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import { useNavigationStore } from '@/stores/useNavigationStore';
import { TOOLS, TOOL_COLORS } from '@/lib/tools';
import { useToolStore } from '@/stores/useToolStore';
import {
  Home,
  Radio,
  Server,
  GitBranch,
  Flame,
  GitPullRequest,
  Star,
  Clock,
  ArrowLeft,
} from 'lucide-react';

const iconMap: Record<string, React.ReactNode> = {
  Home: <Home className="w-4 h-4" />,
  Radio: <Radio className="w-4 h-4" />,
  Server: <Server className="w-4 h-4" />,
  GitBranch: <GitBranch className="w-4 h-4" />,
  Flame: <Flame className="w-4 h-4" />,
  CodeReview: <GitPullRequest className="w-4 h-4" />,
};

export function CommandPalette() {
  const {
    isCommandPaletteOpen,
    closeCommandPalette,
    navigate,
    goBack,
    currentView,
  } = useNavigationStore();
  const { favorites, recentTools, toggleFavorite } = useToolStore();

  const handleSelect = useCallback(
    (callback: () => void) => {
      closeCommandPalette();
      callback();
    },
    [closeCommandPalette]
  );

  // CMD+K / CTRL+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isCommandPaletteOpen) {
          closeCommandPalette();
        } else {
          useNavigationStore.getState().openCommandPalette();
        }
      }
      if (e.key === 'Escape' && isCommandPaletteOpen) {
        closeCommandPalette();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, closeCommandPalette]);

  const recentItems = useMemo(() => {
    return recentTools.slice(0, 5).map((tool) => {
      const def = TOOLS.find((t) => t.id === tool.id);
      if (!def) return null;
      return (
        <CommandItem
          key={`recent-${tool.id}`}
          onSelect={() => handleSelect(() => navigate(tool.id as any))}
          className="gap-3"
        >
          <span style={{ color: TOOL_COLORS[def.color].text }}>
            {iconMap[def.icon]}
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-sm truncate">{tool.label}</div>
            <div className="text-xs text-[#55556a]">Recent</div>
          </div>
          <CommandShortcut>↵</CommandShortcut>
        </CommandItem>
      );
    });
  }, [recentTools, handleSelect, navigate]);

  const favoriteItems = useMemo(() => {
    return favorites.map((toolId) => {
      const def = TOOLS.find((t) => t.id === toolId);
      if (!def) return null;
      return (
        <CommandItem
          key={`fav-${toolId}`}
          onSelect={() => handleSelect(() => navigate(toolId as any))}
          className="gap-3"
        >
          <span style={{ color: TOOL_COLORS[def.color].text }}>
            {iconMap[def.icon]}
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-sm truncate">{def.name}</div>
          </div>
          <Star className="w-3.5 h-3.5 text-[#facc15] fill-[#facc15]" />
          <CommandShortcut>↵</CommandShortcut>
        </CommandItem>
      );
    });
  }, [favorites, handleSelect, navigate]);

  return (
    <CommandDialog
      open={isCommandPaletteOpen}
      onOpenChange={(open) => {
        if (!open) closeCommandPalette();
      }}
      className="forge-glass-strong"
    >
      <CommandInput
        placeholder="Search tools, navigate, or run actions..."
        className="h-12 text-sm"
      />
      <CommandList className="max-h-[400px]">
        <CommandEmpty className="py-8 text-[#55556a]">
          No results found.
        </CommandEmpty>

        {/* Navigation */}
        <CommandGroup heading="Navigation" className="gap-1">
          <CommandItem
            onSelect={() => handleSelect(() => navigate('home'))}
            className="gap-3"
          >
            <Home className="w-4 h-4 text-[#8888a0]" />
            <span>Go to Home</span>
            <CommandShortcut>⌘H</CommandShortcut>
          </CommandItem>
          {currentView !== 'home' && (
            <CommandItem
              onSelect={() => handleSelect(() => goBack())}
              className="gap-3"
            >
              <ArrowLeft className="w-4 h-4 text-[#8888a0]" />
              <span>Go Back</span>
              <CommandShortcut>⌘[</CommandShortcut>
            </CommandItem>
          )}
        </CommandGroup>

        <CommandSeparator />

        {/* Recent */}
        {recentItems.length > 0 && (
          <>
            <CommandGroup heading="Recent">{recentItems}</CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* Favorites */}
        {favoriteItems.length > 0 && (
          <>
            <CommandGroup heading="Favorites">{favoriteItems}</CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* All Tools */}
        <CommandGroup heading="Tools">
          {TOOLS.map((tool) => (
            <CommandItem
              key={tool.id}
              onSelect={() =>
                handleSelect(() => navigate(tool.id))
              }
              className="gap-3"
            >
              <span style={{ color: TOOL_COLORS[tool.color].text }}>
                {iconMap[tool.icon]}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm">{tool.name}</div>
                <div className="text-xs text-[#55556a] truncate max-w-[300px]">
                  {tool.description}
                </div>
              </div>
              {favorites.includes(tool.id) && (
                <Star className="w-3.5 h-3.5 text-[#facc15] fill-[#facc15]" />
              )}
              <CommandShortcut>↵</CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        {/* Actions */}
        <CommandGroup heading="Actions">
          {TOOLS.map((tool) => (
            <CommandItem
              key={`toggle-fav-${tool.id}`}
              onSelect={() =>
                handleSelect(() => toggleFavorite(tool.id))
              }
              className="gap-3"
            >
              <Star
                className={`w-4 h-4 ${
                  favorites.includes(tool.id)
                    ? 'text-[#facc15] fill-[#facc15]'
                    : 'text-[#55556a]'
                }`}
              />
              <span>
                {favorites.includes(tool.id) ? 'Unfavorite' : 'Favorite'}{' '}
                {tool.name}
              </span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}