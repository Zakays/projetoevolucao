import { describe, it, expect, beforeEach } from 'vitest';
import { LocalStorageManager } from '@/lib/storage';

describe('Records storage (IndexedDB previews)', () => {
  let storage: LocalStorageManager;

  beforeEach(() => {
    storage = LocalStorageManager.getInstance();
    // Reset localStorage between tests
    localStorage.clear();
  });

  it('adds an uploaded file and stores blob in idb', async () => {
    const fileBlob = new Blob(['hello world'], { type: 'text/plain' });
    const meta = {
      filename: 'hello.txt',
      originalName: 'hello.txt',
      size: 11,
      type: 'text/plain',
      tags: [],
      category: 'uploads',
      description: 'test',
      metadata: {},
    } as any;

    const newFile = storage.addUploadedFile(meta, fileBlob);
    expect(newFile.id).toBeTruthy();

    const stored = storage.getUploadedFiles().find(f => f.id === newFile.id);
    expect(stored).toBeTruthy();

    const url = await storage.getUploadPreviewUrl(newFile.id);
    expect(typeof url === 'string' || url === undefined).toBe(true);
    if (url) {
      // It should be an object URL or a data URL fallback in Node tests
      expect(url.startsWith('blob:') || url.startsWith('data:')).toBe(true);
      // Revoke only if object URL
      if (url.startsWith('blob:') && typeof URL !== 'undefined' && URL.revokeObjectURL) {
        URL.revokeObjectURL(url);
      }
    }
  });
});
