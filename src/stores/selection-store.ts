import { create } from 'zustand';

/**
 * Grid row selection — ephemeral UI state shared between Process 1 (grid) and
 * Process 2 (optimize drawer). Kept in Zustand (not server cache) per Doc 01 §6.
 */
interface SelectionState {
  selectedIds: string[];
  toggle: (id: string) => void;
  setMany: (ids: string[], selected: boolean) => void;
  clear: () => void;
  isSelected: (id: string) => boolean;
}

export const useSelectionStore = create<SelectionState>((set, get) => ({
  selectedIds: [],
  toggle: (id) =>
    set((s) => ({
      selectedIds: s.selectedIds.includes(id)
        ? s.selectedIds.filter((x) => x !== id)
        : [...s.selectedIds, id],
    })),
  setMany: (ids, selected) =>
    set((s) => {
      const next = new Set(s.selectedIds);
      ids.forEach((id) => (selected ? next.add(id) : next.delete(id)));
      return { selectedIds: [...next] };
    }),
  clear: () => set({ selectedIds: [] }),
  isSelected: (id) => get().selectedIds.includes(id),
}));
