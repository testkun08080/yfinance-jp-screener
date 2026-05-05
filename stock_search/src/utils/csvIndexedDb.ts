import { CSV_LOCAL_CACHE } from "../constants/csv";

export interface PersistedCsvRecord {
  blob: Blob;
  name: string;
  size: number;
  /**
   * 元ファイルの最終更新時刻 (`File.lastModified`) をそのまま保存する。
   * メタが欠損していた場合は `0` (= 1970-01-01) を返し、UI 側で「不明」として扱う。
   */
  lastModified: number;
}

export type PersistErrorReason =
  | "open"
  | "blocked"
  | "quota"
  | "abort"
  | "timeout"
  | "unknown";

export class PersistError extends Error {
  readonly reason: PersistErrorReason;
  constructor(reason: PersistErrorReason, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "PersistError";
    this.reason = reason;
  }
}

const DB_OPEN_TIMEOUT_MS = 5_000;
const TX_TIMEOUT_MS = 10_000;

function isQuotaExceeded(err: unknown): boolean {
  if (!err) return false;
  if (err instanceof DOMException) {
    return (
      err.name === "QuotaExceededError" ||
      // Firefox 互換: 旧 code 値
      err.code === 22
    );
  }
  return false;
}

function withTimeout<T>(p: Promise<T>, ms: number, reason: PersistErrorReason): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => {
      reject(new PersistError(reason, `IndexedDB ${reason} timed out after ${ms}ms`));
    }, ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      }
    );
  });
}

function openDbInternal(): Promise<IDBDatabase> {
  const { dbName, dbVersion, storeName } = CSV_LOCAL_CACHE;
  return new Promise((resolve, reject) => {
    let req: IDBOpenDBRequest;
    try {
      req = indexedDB.open(dbName, dbVersion);
    } catch (e) {
      reject(
        new PersistError(
          "open",
          "IndexedDB の open に失敗しました",
          { cause: e instanceof Error ? e : undefined }
        )
      );
      return;
    }
    req.onerror = () =>
      reject(
        new PersistError(
          "open",
          req.error?.message ?? "IndexedDB open failed",
          { cause: req.error ?? undefined }
        )
      );
    req.onblocked = () =>
      reject(
        new PersistError(
          "blocked",
          "IndexedDB が他のタブにブロックされています"
        )
      );
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName);
      }
    };
    req.onsuccess = () => {
      const db = req.result;
      // 別タブで新しい version が要求されたら閉じて衝突を防ぐ
      db.onversionchange = () => {
        try {
          db.close();
        } catch {
          /* noop */
        }
      };
      resolve(db);
    };
  });
}

function openDb(): Promise<IDBDatabase> {
  return withTimeout(openDbInternal(), DB_OPEN_TIMEOUT_MS, "timeout");
}

function awaitTx(tx: IDBTransaction): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onabort = () =>
      reject(
        new PersistError(
          "abort",
          tx.error?.message ?? "IndexedDB transaction aborted",
          { cause: tx.error ?? undefined }
        )
      );
    tx.onerror = () =>
      reject(
        new PersistError(
          isQuotaExceeded(tx.error) ? "quota" : "unknown",
          tx.error?.message ?? "IndexedDB transaction error",
          { cause: tx.error ?? undefined }
        )
      );
  });
}

/**
 * 直近の CSV を端末内ブラウザ（IndexedDB）に保存する。オリジン外には出ない。
 * 失敗時は `PersistError` を throw する（quota 超過、タイムアウト等）。
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
    try {
      store.put(record, CSV_LOCAL_CACHE.recordKey);
    } catch (e) {
      // put 同期スローも一応救う（一部ブラウザは synchronous throw する）
      if (isQuotaExceeded(e)) {
        try {
          tx.abort();
        } catch {
          /* noop */
        }
        throw new PersistError(
          "quota",
          "ブラウザのストレージ容量が不足しています",
          { cause: e instanceof Error ? e : undefined }
        );
      }
      throw e;
    }
    await withTimeout(awaitTx(tx), TX_TIMEOUT_MS, "timeout");
  } finally {
    db.close();
  }
}

export async function loadPersistedCsv(): Promise<PersistedCsvRecord | null> {
  const db = await openDb();
  try {
    const tx = db.transaction(CSV_LOCAL_CACHE.storeName, "readonly");
    const store = tx.objectStore(CSV_LOCAL_CACHE.storeName);
    const record = await withTimeout(
      new Promise<unknown>((resolve, reject) => {
        const r = store.get(CSV_LOCAL_CACHE.recordKey);
        r.onsuccess = () => resolve(r.result);
        r.onerror = () =>
          reject(
            new PersistError(
              "unknown",
              r.error?.message ?? "IndexedDB get failed",
              { cause: r.error ?? undefined }
            )
          );
      }),
      TX_TIMEOUT_MS,
      "timeout"
    );
    if (!record || typeof record !== "object") return null;
    const o = record as Partial<PersistedCsvRecord>;
    if (!o.blob || !(o.blob instanceof Blob)) return null;
    const name = typeof o.name === "string" && o.name.length > 0 ? o.name : "data.csv";
    const size = typeof o.size === "number" ? o.size : o.blob.size;
    // メタが欠損している場合は不明値として 0 を返す（呼び出し側で扱いを決める）。
    const lastModified = typeof o.lastModified === "number" ? o.lastModified : 0;
    return { blob: o.blob, name, size, lastModified };
  } finally {
    db.close();
  }
}

export async function clearPersistedCsv(): Promise<void> {
  const db = await openDb();
  try {
    const tx = db.transaction(CSV_LOCAL_CACHE.storeName, "readwrite");
    const store = tx.objectStore(CSV_LOCAL_CACHE.storeName);
    store.delete(CSV_LOCAL_CACHE.recordKey);
    await withTimeout(awaitTx(tx), TX_TIMEOUT_MS, "timeout");
  } finally {
    db.close();
  }
}
