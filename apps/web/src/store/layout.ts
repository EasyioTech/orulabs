import { create } from "zustand";

interface LayoutState {
  isMobileSidebarOpen: boolean;
  setMobileSidebarOpen: (isOpen: boolean) => void;
  toggleMobileSidebar: () => void;
  
  isDesktopSidebarOpen: boolean;
  setDesktopSidebarOpen: (isOpen: boolean) => void;
  toggleDesktopSidebar: () => void;
}

export const useLayoutStore = create<LayoutState>((set) => ({
  isMobileSidebarOpen: false,
  setMobileSidebarOpen: (isOpen) => set({ isMobileSidebarOpen: isOpen }),
  toggleMobileSidebar: () => set((state) => ({ isMobileSidebarOpen: !state.isMobileSidebarOpen })),
  
  isDesktopSidebarOpen: true,
  setDesktopSidebarOpen: (isOpen) => set({ isDesktopSidebarOpen: isOpen }),
  toggleDesktopSidebar: () => set((state) => ({ isDesktopSidebarOpen: !state.isDesktopSidebarOpen })),
}));
