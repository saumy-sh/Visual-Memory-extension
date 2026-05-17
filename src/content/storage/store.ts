import { create } from "zustand";
import type { ScreenshotItem } from "../../shared/types";

interface Store {
  screenshots: ScreenshotItem[];
  isCapturing: boolean;
  expandedId: string | null;
  setScreenshots: (items: ScreenshotItem[]) => void;
  addScreenshot: (item: ScreenshotItem) => void;
  removeScreenshot: (id: string) => void;
  setCapturing: (val: boolean) => void;
  setExpandedId: (id: string | null) => void;
}

export const useStore = create<Store>((set) => ({
  screenshots: [],
  isCapturing: false,
  expandedId: null,
  setScreenshots: (items) => set({ screenshots: items }),
  addScreenshot: (item) => set((s) => ({ screenshots: [...s.screenshots, item] })),
  removeScreenshot: (id) => set((s) => ({
    screenshots: s.screenshots.filter((x) => x.id !== id),
    expandedId: s.expandedId === id ? null : s.expandedId,
  })),
  setCapturing: (val) => set({ isCapturing: val }),
  setExpandedId: (id) => set({ expandedId: id }),
}));