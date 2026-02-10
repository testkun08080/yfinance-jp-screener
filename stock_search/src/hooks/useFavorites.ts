import { useState, useCallback, useEffect, useMemo } from "react";
import type { FavoriteItem } from "../types/stock";

const STORAGE_KEY = "stock-search-favorites";

function loadFavorites(): FavoriteItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is FavoriteItem =>
        typeof x === "object" &&
        x !== null &&
        typeof (x as FavoriteItem).code === "string"
    );
  } catch {
    return [];
  }
}

function saveFavorites(items: FavoriteItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore quota / private mode
  }
}

/** 銘柄コードを正規化（4桁ゼロパディングなど） */
function normalizeCode(code: string): string {
  const s = String(code).trim();
  if (/^\d{1,4}$/.test(s)) return s.padStart(4, "0");
  return s;
}

export function useFavorites() {
  const [items, setItems] = useState<FavoriteItem[]>(() => loadFavorites());

  useEffect(() => {
    saveFavorites(items);
  }, [items]);

  const add = useCallback((code: string, name?: string) => {
    const normalized = normalizeCode(code);
    if (!normalized) return;
    setItems((prev) => {
      if (prev.some((x) => normalizeCode(x.code) === normalized)) return prev;
      return [...prev, { code: normalized, name: name?.trim() || undefined }];
    });
  }, []);

  const remove = useCallback((code: string) => {
    const normalized = normalizeCode(code);
    setItems((prev) =>
      prev.filter((x) => normalizeCode(x.code) !== normalized)
    );
  }, []);

  const isFavorite = useCallback(
    (code: string) => {
      const normalized = normalizeCode(code);
      return items.some((x) => normalizeCode(x.code) === normalized);
    },
    [items]
  );

  const toggle = useCallback(
    (code: string, name?: string) => {
      const normalized = normalizeCode(code);
      if (items.some((x) => normalizeCode(x.code) === normalized)) {
        remove(code);
      } else {
        add(code, name);
      }
    },
    [items, add, remove]
  );

  const favoriteCodesSet = useMemo(
    () => new Set(items.map((x) => normalizeCode(x.code))),
    [items]
  );

  return {
    favorites: items,
    favoriteCodesSet,
    add,
    remove,
    isFavorite,
    toggle,
  };
}
