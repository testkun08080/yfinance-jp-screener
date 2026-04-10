import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { MdMenu } from "react-icons/md";
import { AppSidebarNav } from "./AppSidebarNav";

/**
 * データビューア以外のページ用: 左にアプリナビ（デスクトップ常時 / モバイルは FAB + ドロワー）
 */
export function SecondaryLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-white md:flex-row">
      <aside className="hidden h-full w-56 flex-shrink-0 flex-col overflow-y-auto border-r border-[var(--border)] bg-white md:flex">
        <AppSidebarNav />
      </aside>

      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
        <button
          type="button"
          className="fixed bottom-5 left-4 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-md md:hidden"
          style={{
            marginBottom: "max(0px, env(safe-area-inset-bottom, 0px))",
            marginLeft: "max(0px, env(safe-area-inset-left, 0px))",
          }}
          onClick={() => setMobileOpen(true)}
          aria-expanded={mobileOpen}
          aria-label="メニューを開く"
        >
          <MdMenu className="text-2xl" aria-hidden />
        </button>

        {mobileOpen ? (
          <>
            <button
              type="button"
              className="fixed inset-0 z-40 bg-black/40 md:hidden"
              aria-label="メニューを閉じる"
              onClick={() => setMobileOpen(false)}
            />
            <aside className="fixed bottom-0 left-0 top-0 z-50 flex w-[min(288px,88vw)] flex-col overflow-y-auto bg-white shadow-xl md:hidden">
              <AppSidebarNav
                onClose={() => setMobileOpen(false)}
                onNavigate={() => setMobileOpen(false)}
              />
            </aside>
          </>
        ) : null}

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 overflow-auto pb-[5.5rem] md:pb-0">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
