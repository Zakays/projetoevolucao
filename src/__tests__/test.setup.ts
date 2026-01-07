import '@testing-library/jest-dom';

// Minimal polyfill for matchMedia (used by some UI libs)
if (typeof window !== 'undefined' && !window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

// Polyfill ResizeObserver for Radix UI components used in the app
if (typeof (globalThis as any).ResizeObserver === 'undefined') {
  (globalThis as any).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// Polyfill MutationObserver for libs that rely on it in the DOM
if (typeof (globalThis as any).MutationObserver === 'undefined') {
  (globalThis as any).MutationObserver = class {
    constructor(cb: any) { }
    observe() {}
    disconnect() {}
    takeRecords() { return []; }
  };
}

// Clear in-memory IDB fallback between tests to avoid memory buildup
import { clearInMemoryUploads } from '@/lib/idb';
import { LocalStorageManager } from '@/lib/storage';
import { cleanup } from '@testing-library/react';

beforeEach(() => {
  localStorage.clear();
  clearInMemoryUploads();
  try {
    LocalStorageManager.getInstance().resetForTests();
  } catch (e) {
    // ignore if reset not available
  }
});

// After each test, make sure any in-memory blobs are cleared and report heap usage
afterEach(() => {
  try {
    clearInMemoryUploads();
    try {
      LocalStorageManager.getInstance().resetForTests();
    } catch (e) {
      // ignore
    }
  } catch (e) {
    // ignore
  }

  // Force GC if available (Node must be run with --expose-gc)
  try {
    if (typeof (globalThis as any).gc === 'function') {
      (globalThis as any).gc();
      // run twice to encourage collection of recently freed objects
      (globalThis as any).gc();
    }
  } catch (e) {
    // ignore
  }

  // Run testing-library cleanup to unmount React trees and remove elements
  try {
    cleanup();
  } catch (e) {
    // ignore
  }

  // Report high heap usage to help pinpoint leaking tests
  try {
    const heap = process && typeof process.memoryUsage === 'function' ? process.memoryUsage().heapUsed : 0;
    const threshold = 50 * 1024 * 1024; // 50 MB (warn earlier)
    if (heap > threshold) {
       
      console.warn('TEST_HEAP_HIGH:', heap);
    }

    // Also report localStorage size and storage data size to catch large persisted payloads
    try {
      let lsSize = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const v = localStorage.getItem(key) || '';
          lsSize += v.length;
        }
      }
      if (lsSize > 100 * 1024) {
         
        console.warn('TEST_LOCALSTORAGE_LARGE:', lsSize);
      }

      // Check storage internal JSON size
      try {
        const dataSize = JSON.stringify(LocalStorageManager.getInstance().getData()).length;
        if (dataSize > 200 * 1024) {
           
          console.warn('TEST_STORAGE_JSON_LARGE:', dataSize);
        }
      } catch (e) {
        // ignore
      }
    } catch (e) {
      // ignore
    }
  } catch (e) {
    // ignore
  }
}); 