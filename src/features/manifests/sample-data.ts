import type { ManifestStatus, Priority } from '@/types';

/** Hardcoded Bali sample rows for the static wireframe (Phase 0 — no fetch yet). */
export interface SampleManifest {
  id: string;
  recipient: string;
  region: string;
  priority: Priority;
  weight: number;
  status: ManifestStatus;
}

export const SAMPLE_MANIFESTS: SampleManifest[] = [
  { id: 'MNF-240001', recipient: 'Bali Fresh Organics Tbk', region: 'Denpasar Utara', priority: 'HIGH', weight: 1240, status: 'IN_TRANSIT' },
  { id: 'MNF-240002', recipient: 'CV Tirta Gangga Trading', region: 'Ubud', priority: 'NORMAL', weight: 380, status: 'DELIVERED' },
  { id: 'MNF-240003', recipient: 'PT Sari Bumi Kuta', region: 'Kuta', priority: 'HIGH', weight: 2050, status: 'EXCEPTION' },
  { id: 'MNF-240004', recipient: 'Warung Babi Guling Pak Malen', region: 'Seminyak', priority: 'NORMAL', weight: 95, status: 'DISPATCHED' },
  { id: 'MNF-240005', recipient: 'UD Kerajinan Perak Celuk', region: 'Gianyar', priority: 'LOW', weight: 180, status: 'QUEUED' },
  { id: 'MNF-240006', recipient: 'Hotel The Layar Seminyak', region: 'Seminyak', priority: 'HIGH', weight: 3200, status: 'ASSIGNED' },
  { id: 'MNF-240007', recipient: 'PT Tirtha Bridal Jimbaran', region: 'Jimbaran', priority: 'HIGH', weight: 420, status: 'IN_TRANSIT' },
  { id: 'MNF-240008', recipient: 'Sanur Beach Villas Management', region: 'Sanur', priority: 'NORMAL', weight: 860, status: 'OPTIMIZING' },
  { id: 'MNF-240009', recipient: 'CV Bali Tangi Cosmetics', region: 'Canggu', priority: 'NORMAL', weight: 640, status: 'IN_TRANSIT' },
  { id: 'MNF-240010', recipient: 'PT Dewata Agung Foods', region: 'Denpasar Selatan', priority: 'HIGH', weight: 1800, status: 'DELIVERED' },
  { id: 'MNF-240011', recipient: 'Koperasi Perikanan Kedonganan', region: 'Jimbaran', priority: 'HIGH', weight: 4100, status: 'DISPATCHED' },
  { id: 'MNF-240012', recipient: 'Toko Oleh-Oleh Krisna', region: 'Denpasar Timur', priority: 'NORMAL', weight: 720, status: 'QUEUED' },
  { id: 'MNF-240013', recipient: 'The Nusa Dua Beach Hotel', region: 'Nusa Dua', priority: 'HIGH', weight: 2800, status: 'ASSIGNED' },
  { id: 'MNF-240014', recipient: 'PT Bali Hai Diving Adventures', region: 'Benoa', priority: 'NORMAL', weight: 1150, status: 'SELECTED' },
  { id: 'MNF-240015', recipient: 'RS BIMC Kuta', region: 'Kuta', priority: 'HIGH', weight: 340, status: 'EXCEPTION' },
];

/** Rows shown pre-selected in the static wireframe. */
export const PRESELECTED_IDS = ['MNF-240001', 'MNF-240007', 'MNF-240014'];
