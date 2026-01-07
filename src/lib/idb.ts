let _inMemoryUploads = new Map<string, Blob>();
let _useIndexedDB = false;
let _dbPromise: any = null;
let _openDB: any = null;

// Default DB configuration
const DB_NAME = 'glowup_uploads';
const DB_VERSION = 1;
const UPLOADS_STORE = 'uploads';

// Attempt dynamic import for 'idb' in environments that support it. In test environments this may fail.
(async () => {
  try {
    const idb = await import('idb');
    // Import returns a module object; pull out openDB
     
    _openDB = (idb as any).openDB;
    _useIndexedDB = true;
  } catch (err) {
    _useIndexedDB = false;
  }
})();

async function getDBInternal() {
  if (!_useIndexedDB) return null;
  if (!_dbPromise) {
    _dbPromise = _openDB(DB_NAME, DB_VERSION, {
      upgrade(db: any) {
        if (!db.objectStoreNames.contains(UPLOADS_STORE)) {
          db.createObjectStore(UPLOADS_STORE);
        }
      },
    });
  }
  return _dbPromise;
}

export async function saveUploadBlob(id: string, blob: Blob) {
  if (_useIndexedDB) {
    const db = await getDBInternal();
    await db.put(UPLOADS_STORE, blob, id);
  } else {
    _inMemoryUploads.set(id, blob);
  }
}

export async function getUploadBlob(id: string): Promise<Blob | undefined> {
  if (_useIndexedDB) {
    const db = await getDBInternal();
    return await db.get(UPLOADS_STORE, id);
  }
  return _inMemoryUploads.get(id);
}

export async function deleteUploadBlob(id: string) {
  if (_useIndexedDB) {
    const db = await getDBInternal();
    await db.delete(UPLOADS_STORE, id);
  } else {
    _inMemoryUploads.delete(id);
  }
}

// Test helper: clear in-memory uploads to avoid memory buildup across tests
export function clearInMemoryUploads() {
  _inMemoryUploads = new Map<string, Blob>();
}
