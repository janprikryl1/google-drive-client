export type CachedFile = {
  id: string;
  name: string;
  folderId: string;
  mimeType: string;
  size: number;
  modifiedTime: string; // Server modifiedTime when cached
  cachedAt: number;     // Local timestamp
  blob: Blob;
};

export type CachedFolder = {
  id: string;
  name: string;
  cachedAt: number;
};

export type OfflineUploadItem = {
  queueId: string;
  name: string;
  folderId: string;
  mimeType: string;
  size: number;
  blob: Blob;
  createdAt: number;
};

export type ConflictItem = {
  queueItem: OfflineUploadItem;
  serverFile: {
    id: string;
    name: string;
    modifiedTime: string;
    size?: string;
  };
};

const DB_NAME = 'google_drive_cache_db';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains('cached_files')) {
        const store = db.createObjectStore('cached_files', { keyPath: 'id' });
        store.createIndex('folderId', 'folderId', { unique: false });
      }

      if (!db.objectStoreNames.contains('cached_folders')) {
        db.createObjectStore('cached_folders', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('offline_queue')) {
        const store = db.createObjectStore('offline_queue', { keyPath: 'queueId' });
        store.createIndex('folderId', 'folderId', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// --- Cached Files ---

export async function saveFileToCache(file: CachedFile): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('cached_files', 'readwrite');
    const store = tx.objectStore('cached_files');
    const request = store.put(file);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getFileFromCache(id: string): Promise<CachedFile | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('cached_files', 'readonly');
    const store = tx.objectStore('cached_files');
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function removeFileFromCache(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('cached_files', 'readwrite');
    const store = tx.objectStore('cached_files');
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getAllCachedFiles(): Promise<CachedFile[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('cached_files', 'readonly');
    const store = tx.objectStore('cached_files');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function getCachedFilesByFolder(folderId: string): Promise<CachedFile[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('cached_files', 'readonly');
    const store = tx.objectStore('cached_files');
    const index = store.index('folderId');
    const request = index.getAll(folderId);

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

// --- Cached Folders ---

export async function saveFolderToCache(folder: CachedFolder): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('cached_folders', 'readwrite');
    const store = tx.objectStore('cached_folders');
    const request = store.put(folder);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function removeFolderFromCache(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('cached_folders', 'readwrite');
    const store = tx.objectStore('cached_folders');
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getAllCachedFolders(): Promise<CachedFolder[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('cached_folders', 'readonly');
    const store = tx.objectStore('cached_folders');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

// --- Offline Upload Queue ---

export async function addOfflineUpload(item: OfflineUploadItem): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('offline_queue', 'readwrite');
    const store = tx.objectStore('offline_queue');
    const request = store.put(item);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getOfflineUploads(): Promise<OfflineUploadItem[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('offline_queue', 'readonly');
    const store = tx.objectStore('offline_queue');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function removeOfflineUpload(queueId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('offline_queue', 'readwrite');
    const store = tx.objectStore('offline_queue');
    const request = store.delete(queueId);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
