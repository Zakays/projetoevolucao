import { describe, it, expect, beforeEach, vi } from 'vitest';
import { storage } from '@/lib/storage';

describe('BodyMeasurements storage APIs', () => {
  beforeEach(() => {
    localStorage.clear();
    storage.importData('{}');
    vi.setSystemTime(new Date('2026-01-02T12:00:00Z'));
  });

  it('returns empty array when none exist', () => {
    const all = storage.getBodyMeasurements();
    expect(all).toEqual([]);
  });

  it('adds a body measurement and retrieves it', () => {
    const payload = {
      date: '2026-01-02',
      weight: 72,
      measurements: { chest: 95, waist: 78, hips: 100 },
      selfAssessment: { energy: 7, confidence: 6, selfEsteem: 6 },
      notes: 'Feeling good',
    };

    const added = storage.addBodyMeasurement(payload);
    expect(added.id).toBeTruthy();
    expect(added.createdAt).toBeTruthy();
    expect(added.updatedAt).toBeTruthy();
    expect(added.weight).toBe(72);

    const all = storage.getBodyMeasurements();
    expect(all.length).toBe(1);
    expect(all[0].id).toBe(added.id);
  });

  it('updates an existing measurement', () => {
    const added = storage.addBodyMeasurement({
      date: '2026-01-02',
      weight: 70,
      measurements: { chest: 94 },
      selfAssessment: { energy: 5, confidence: 5, selfEsteem: 5 },
    });

    const ok = storage.updateBodyMeasurement(added.id, { weight: 69, notes: 'Updated' });
    expect(ok).toBe(true);

    const updated = storage.getBodyMeasurements().find(m => m.id === added.id)!;
    expect(updated.weight).toBe(69);
    expect(updated.notes).toBe('Updated');
    // Allow equal timestamps when system time is mocked
    expect(new Date(updated.updatedAt).getTime()).toBeGreaterThanOrEqual(new Date(updated.createdAt).getTime());
  });

  it('deletes a measurement', () => {
    const added = storage.addBodyMeasurement({
      date: '2026-01-02',
      weight: 70,
      measurements: { chest: 94 },
      selfAssessment: { energy: 5, confidence: 5, selfEsteem: 5 },
    });

    const ok = storage.deleteBodyMeasurement(added.id);
    expect(ok).toBe(true);

    const all = storage.getBodyMeasurements();
    expect(all.find(m => m.id === added.id)).toBeUndefined();
  });
});