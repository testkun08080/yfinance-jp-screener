import { useEffect, useRef } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  MdAnalytics,
  MdChevronLeft,
  MdClose,
  MdExpandMore,
  MdMenu,
} from "react-icons/md";
import { NAVIGATION_ITEMS } from "../constants/ui";

export interface AppSidebarNavProps {
  /** モバイルドロワーなどを閉じる */
  onClose?: () => void;
  /** データビューア: デスクトップでフィルターサイドバーを折りたたむ */
  onCollapse?: () => void;
  /** いずれかのナビリンクを押したとき（ドロワー自動クローズ用） */
  onNavigate?: () => void;
}

export function AppSidebarNav({
  onClose,
  onCollapse,
  onNavigate,
}: AppSidebarNavProps) {
  const location = useLocation();
  const menuDetailsRef = useRef<HTMLDetailsElement>(null);

  const closeMenu = () => {
    const el = menuDetailsRef.current;
    if (el) el.open = false;
  };

  useEffect(() => {
    const el = menuDetailsRef.current;
    if (el) el.open = false;
  }, [location.pathname]);

  const handleNav = () => {
    closeMenu();
    onNavigate?.();
  };

  return (
    <>
      <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] px-2 py-2 flex-shrink-0">
        <Link
          to="/"
          onClick={handleNav}
          className="flex min-w-0 items-center gap-2 no-underline text-inherit hover:opacity-90"
          aria-label="ホーム（データビューア）"
        >
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--primary)] text-white">
            <MdAnalytics className="text-xl" aria-hidden />
          </div>
          <span className="truncate font-bold tracking-tight text-slate-800">
            <span className="text-[var(--primary)]">yfsc</span>
          </span>
        </Link>
        <div className="flex flex-shrink-0 items-center gap-0.5">
          {onCollapse && (
            <button
              type="button"
              className="hidden rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:flex"
              onClick={onCollapse}
              aria-label="サイドバーを折りたたむ"
              title="サイドバーを折りたたむ"
            >
              <MdChevronLeft className="text-lg" />
            </button>
          )}
          {onClose && (
            <button
              type="button"
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
              onClick={onClose}
              aria-label="閉じる"
            >
              <MdClose className="text-xl" />
            </button>
          )}
        </div>
      </div>

      <details
        ref={menuDetailsRef}
        className="group border-b border-[var(--border)] flex-shrink-0"
      >
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50 [&::-webkit-details-marker]:hidden">
          <span className="flex min-w-0 items-center gap-1.5 font-medium">
            <MdMenu className="flex-shrink-0 text-lg text-slate-500" aria-hidden />
            <span className="truncate">アプリメニュー</span>
          </span>
          <MdExpandMore
            className="flex-shrink-0 text-lg text-slate-400 transition-transform group-open:rotate-180"
            aria-hidden
          />
        </summary>
        <nav className="px-1 pb-2 pt-0.5" aria-label="アプリメニュー">
          <ul className="space-y-0.5">
            {NAVIGATION_ITEMS.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === "/"}
                  onClick={handleNav}
                  className={({ isActive }) =>
                    `flex items-center gap-2 rounded-md px-2 py-1.5 text-sm no-underline transition-colors ${
                      isActive
                        ? "bg-[var(--primary)]/10 font-semibold text-[var(--primary)]"
                        : "text-slate-700 hover:bg-slate-50"
                    }`
                  }
                >
                  <span className="text-base leading-none" aria-hidden>
                    {item.icon}
                  </span>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </details>
    </>
  );
}
