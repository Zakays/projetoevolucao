import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LocalStorageManager } from '@/lib/storage';
import * as persistence from '@/lib/persistence';

describe('sync queue', () => {
  beforeEach(() => {
    // Reset instance and localStorage
    try { localStorage.clear(); } catch (e) {}
    // Recreate singleton by resetting instance state
    try { LocalStorageManager.getInstance().resetForTests(); } catch (e) {}
  });

  it('enqueues snapshot when offline and does not call remote save', async () => {
    // Force offline
    Object.defineProperty(window.navigator, 'onLine', { value: false, configurable: true });

    const spy = vi.spyOn(persistence, 'saveData');

    const store = LocalStorageManager.getInstance();

    store.addHabit({ title: 'Test Habit', daysOfWeek: [0,1,2], weight: 1 });

    // saveDataRemote should not have been called (we are offline)
    expect(spy).not.toHaveBeenCalled();

    const queue = store.getSyncQueue();
    expect(queue.length).toBeGreaterThanOrEqual(1);
    expect(queue[0].type).toBe('snapshot');
    expect(queue[0].status).toBe('pending');
  });

  it('processes queue when back online and removes snapshot on success', async () => {
    // Start offline and enqueue
    Object.defineProperty(window.navigator, 'onLine', { value: false, configurable: true });
    const store = LocalStorageManager.getInstance();

    store.addHabit({ title: 'Sync Habit', daysOfWeek: [1,2,3], weight: 1 });

    const queueBefore = store.getSyncQueue();
    expect(queueBefore.length).toBeGreaterThanOrEqual(1);

    // Now mock remote to succeed and go online
    const spy = vi.spyOn(persistence, 'saveData').mockResolvedValue(true);
    Object.defineProperty(window.navigator, 'onLine', { value: true, configurable: true });

    // Force processing
    await store.forceSyncNow();

    const queueAfter = store.getSyncQueue();
    expect(queueAfter.length).toBe(0);
    expect(spy).toHaveBeenCalled();

    spy.mockRestore();
  });
});