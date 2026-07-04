import { create } from 'zustand';

interface ToolState {
  favorites: string[];
  recentTools: Array<{ id: string; label: string; accessedAt: number }>;
  toggleFavorite: (toolId: string) => void;
  addRecentTool: (toolId: string, label: string) => void;
  isFavorite: (toolId: string) => boolean;
  getRecentTools: () => Array<{ id: string; label: string; accessedAt: number }>;
}

const MAX_RECENT = 10;

function loadState<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const stored = localStorage.getItem(`forge-${key}`);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

function saveState<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`forge-${key}`, JSON.stringify(value));
  } catch {
    // Ignore storage errors
  }
}

export const useToolStore = create<ToolState>((set, get) => ({
  favorites: loadState('favorites', []),
  recentTools: loadState('recentTools', []),

  toggleFavorite: (toolId: string) => {
    const current = get().favorites;
    const next = current.includes(toolId)
      ? current.filter((id) => id !== toolId)
      : [...current, toolId];
    saveState('favorites', next);
    set({ favorites: next });
  },

  addRecentTool: (toolId: string, label: string) => {
    const current = get().recentTools.filter((t) => t.id !== toolId);
    const next = [{ id: toolId, label, accessedAt: Date.now() }, ...current].slice(
      0,
      MAX_RECENT
    );
    saveState('recentTools', next);
    set({ recentTools: next });
  },

  isFavorite: (toolId: string) => get().favorites.includes(toolId),

  getRecentTools: () => get().recentTools,
}));