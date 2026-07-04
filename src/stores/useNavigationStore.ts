import { create } from 'zustand';
import { ViewType, ToolId } from '@/lib/types';

interface NavigationState {
  currentView: ViewType;
  previousView: ViewType | null;
  viewHistory: ViewType[];
  isCommandPaletteOpen: boolean;
  navigate: (view: ViewType) => void;
  goBack: () => void;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  toggleCommandPalette: () => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  currentView: 'home',
  previousView: null,
  viewHistory: ['home'],
  isCommandPaletteOpen: false,

  navigate: (view: ViewType) => {
    set((state) => ({
      previousView: state.currentView,
      currentView: view,
      viewHistory: [...state.viewHistory, view],
    }));
  },

  goBack: () => {
    set((state) => {
      const newHistory = state.viewHistory.slice(0, -1);
      const prevView = newHistory[newHistory.length - 1] || 'home';
      return {
        currentView: prevView,
        previousView: state.currentView,
        viewHistory: newHistory.length > 0 ? newHistory : ['home'],
      };
    });
  },

  openCommandPalette: () => set({ isCommandPaletteOpen: true }),
  closeCommandPalette: () => set({ isCommandPaletteOpen: false }),
  toggleCommandPalette: () =>
    set((state) => ({ isCommandPaletteOpen: !state.isCommandPaletteOpen })),
}));