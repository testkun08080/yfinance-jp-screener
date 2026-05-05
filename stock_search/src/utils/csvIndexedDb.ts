import { CSV_LOCAL_CACHE } from "../constants/csv";

export interface PersistedCsvRecord {
  blob: Blob;
  name: string;
  size: number;
  lastModified: number;
}

function openDb(): Promise<IDBDatabase> {
  const { dbName, dbVersion, storeName } = CSV_LOCAL_CACHE;
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(dbName, dbVersion);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB open failed"));
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName);
      }
    };
    req.onsuccess = () => resolve(req.result);
  });
}

/**
 * 直近の CSV を端末内ブラウザ（IndexedDB）に保存する。オリジン外には出ない。
 */
export async function savePersistedCsv(
  file: Blob,
  meta: Omit<PersistedCsvRecord, "blob">
): Promise<void> {
  const db = await openDb();
  try {
    const tx = db.transaction(CSV_LOCAL_CACHE.storeName, "readwrite");
    const store = tx.objectStore(CSV_LOCAL_CACHE.storeName);
    const record: PersistedCsvRecord = { blob: file, ...meta };
    store.put(record, CSV_LOCAL_CACHE.recordKey);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

export async function loadPersistedCsv(): Promise<PersistedCsvRecord | null> {
  const db = await openDb();
  try {
    if (!db.objectStoreNames.contains(CSV_LOCAL_CACHE.storeName)) return null;
    const tx = db.transaction(CSV_LOCAL_CACHE.storeName, "readonly");
    const store = tx.objectStore(CSV_LOCAL_CACHE.storeName);
    const record = await new Promise<unknown>((resolve, reject) => {
      const r = store.get(CSV_LOCAL_CACHE.recordKey);
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
    if (!record || typeof record !== "object") return null;
    const o = record as Partial<PersistedCsvRecord>;
    if (!o.blob || !(o.blob instanceof Blob)) return null;
    const name = typeof o.name === "string" ? o.name : "data.csv";
    const size = typeof o.size === "number" ? o.size : o.blob.size;
    const lastModified =
      typeof o.lastModified === "number" ? o.lastModified : Date.now();
    return { blob: o.blob, name, size, lastModified };
  } finally {
    db.close();
  }
}

export async function clearPersistedCsv(): Promise<void> {
  const db = await openDb();
  try {
    if (!db.objectStoreNames.contains(CSV_LOCAL_CACHE.storeName)) return;
    const tx = db.transaction(CSV_LOCAL_CACHE.storeName, "readwrite");
    const store = tx.objectStore(CSV_LOCAL_CACHE.storeName);
    store.delete(CSV_LOCAL_CACHE.recordKey);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}
