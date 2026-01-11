import { describe, it, expect } from 'vitest';
import { computeRecordsStats } from '@/lib/analytics';

import type { UploadedFile } from '@/types';

describe('computeRecordsStats', () => {
  it('returns zeros for empty list', () => {
    const stats = computeRecordsStats([] as UploadedFile[]);
    expect(stats.totalFiles).toBe(0);
    expect(stats.daysRegistered).toBe(0);
    expect(stats.visualMilestones).toBe(0);
    expect(stats.progressPercent).toBe(0);
  });

  it('counts unique days and milestones and computes percent', () => {
    const files: UploadedFile[] = [
      { id: '1', filename: 'a.jpg', originalName: 'a.jpg', previewUrl: '', size: 100, type: 'image/jpeg', tags: [], category: 'uploads', uploadDate: '2026-01-01T10:00:00Z' },
      { id: '2', filename: 'b.jpg', originalName: 'b.jpg', previewUrl: '', size: 120, type: 'image/jpeg', tags: [], category: 'before-after', uploadDate: '2026-01-01T12:00:00Z' },
      { id: '3', filename: 'c.jpg', originalName: 'c.jpg', previewUrl: '', size: 130, type: 'image/jpeg', tags: [], category: 'marco-especial', uploadDate: '2026-01-02T09:00:00Z' },
    ];

    const stats = computeRecordsStats(files);
    expect(stats.totalFiles).toBe(3);
    expect(stats.daysRegistered).toBe(2);
    expect(stats.visualMilestones).toBe(2);
    // 3 / 300 = 1% rounded
    expect(stats.progressPercent).toBe(1);
  });
});
