import type { UploadedFile } from '@/types';

export type RecordsStats = {
  totalFiles: number;
  daysRegistered: number;
  visualMilestones: number;
  progressPercent: number; // 0-100
};

/**
 * Compute simple stats from uploaded files list.
 * Kept deterministic and side-effect free for easy testing.
 */
export function computeRecordsStats(files: UploadedFile[] = []): RecordsStats {
  const totalFiles = files.length;

  const uniqueDays = new Set(files.map(f => (f.uploadDate || '').substring(0, 10)));
  const daysRegistered = uniqueDays.size || 0;

  const visualMilestones = files.filter(f => f.category === 'before-after' || f.category === 'marco-especial').length;

  const progressPercent = Math.min(100, Math.round((totalFiles / 300) * 100));

  return { totalFiles, daysRegistered, visualMilestones, progressPercent };
}
