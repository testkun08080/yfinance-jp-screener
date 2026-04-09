import { CHAT_STOCK_CONTEXT_STORAGE_KEY } from "../constants/ai";

const IDB_NAME = "yfsc-chat-context";
const IDB_VERSION = 1;
const STORE = "kv";
const IDB_KEY = "stock-context";

/** localStorage は ~5MB 前後が目安のため、それ以上は IndexedDB に退避 */
const LOCAL_STORAGE_CHAR_BUDGET = 2_500_000;

function openIdb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, IDB_VERSION);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB open failed"));
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
  });
}

async function idbPut(value: string): Promise<void> {
  const db = await openIdb();
  try {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(value, IDB_KEY);
    await new Promise<void>((res, rej) => {
      tx.oncomplete = () => res();
      tx.onerror = () => rej(tx.error);
    });
  } finally {
    db.close();
  }
}

async function idbGet(): Promise<string | null> {
  const db = await openIdb();
  try {
    if (!db.objectStoreNames.contains(STORE)) return null;
    const tx = db.transaction(STORE, "readonly");
    const v = await new Promise<unknown>((res, rej) => {
      const r = tx.objectStore(STORE).get(IDB_KEY);
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
    return typeof v === "string" ? v : null;
  } finally {
    db.close();
  }
}

async function idbDelete(): Promise<void> {
  const db = await openIdb();
  try {
    if (!db.objectStoreNames.contains(STORE)) return;
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(IDB_KEY);
    await new Promise<void>((res, rej) => {
      tx.oncomplete = () => res();
      tx.onerror = () => rej(tx.error);
    });
  } finally {
    db.close();
  }
}

export async function saveChatStockContext(text: string): Promise<void> {
  try {
    if (text.length <= LOCAL_STORAGE_CHAR_BUDGET) {
      localStorage.setItem(CHAT_STOCK_CONTEXT_STORAGE_KEY, text);
      await idbDelete().catch(() => {});
    } else {
      localStorage.removeItem(CHAT_STOCK_CONTEXT_STORAGE_KEY);
      await idbPut(text);
    }
  } catch {
    try {
      localStorage.removeItem(CHAT_STOCK_CONTEXT_STORAGE_KEY);
      await idbPut(text);
    } catch {
      /* ignore */
    }
  }
}

export async function loadChatStockContext(): Promise<string | null> {
  try {
    const ls = localStorage.getItem(CHAT_STOCK_CONTEXT_STORAGE_KEY);
    if (ls !== null) return ls;
  } catch {
    /* ignore */
  }
  try {
    return await idbGet();
  } catch {
    return null;
  }
}

export async function clearChatStockContext(): Promise<void> {
  try {
    localStorage.removeItem(CHAT_STOCK_CONTEXT_STORAGE_KEY);
  } catch {
    /* ignore */
  }
  try {
    await idbDelete();
  } catch {
    /* ignore */
  }
}
