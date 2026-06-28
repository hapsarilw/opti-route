import { create } from 'zustand';
import type { Manifest } from '@/types';

/**
 * Grid row selection — ephemeral UI state shared between Process 1 (grid) and
 * Process 2 (optimize drawer). Kept in Zustand (not server cache) per Doc 01 §6.
 *
 * Full Manifest objects are stored (not just IDs) so that selectedManifests
 * survives region/filter changes: the drawer always shows every picked row even
 * when the current filter no longer includes them.
 */
interface SelectionState {
  selectedManifests: Manifest[];
  selectedIds: string[]; // kept in sync; derived from selectedManifests
  toggle: (manifest: Manifest) => void;
  setMany: (manifests: Manifest[], selected: boolean) => void;
  clear: () => void;
  isSelected: (id: string) => boolean;
}

function toIds(manifests: Manifest[]): string[] {
  return manifests.map((m) => m.manifest_id);
}

export const useSelectionStore = create<SelectionState>((set, get) => ({
  selectedManifests: [],
  selectedIds: [],
  toggle: (manifest) =>
    set((s) => {
      const exists = s.selectedManifests.some((m) => m.manifest_id === manifest.manifest_id);
      const next = exists
        ? s.selectedManifests.filter((m) => m.manifest_id !== manifest.manifest_id)
        : [...s.selectedManifests, manifest];
      return { selectedManifests: next, selectedIds: toIds(next) };
    }),
  setMany: (manifests, selected) =>
    set((s) => {
      const map = new Map(s.selectedManifests.map((m) => [m.manifest_id, m]));
      manifests.forEach((m) => (selected ? map.set(m.manifest_id, m) : map.delete(m.manifest_id)));
      const next = [...map.values()];
      return { selectedManifests: next, selectedIds: toIds(next) };
    }),
  clear: () => set({ selectedManifests: [], selectedIds: [] }),
  isSelected: (id) => get().selectedManifests.some((m) => m.manifest_id === id),
}));
