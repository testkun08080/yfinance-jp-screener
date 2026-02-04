import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { NAVIGATION_ITEMS } from "../constants/ui";

export const AppHeader = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <header className="h-14 border-b border-[var(--border)] bg-white flex items-center justify-between px-6 flex-shrink-0 z-50">
      <Link
        to="/"
        className="flex items-center gap-3 no-underline text-inherit hover:opacity-90"
        aria-label="ホーム"
      >
        <div className="w-8 h-8 bg-[var(--primary)] rounded-lg flex items-center justify-center text-white">
          <span className="material-symbols-outlined text-xl" aria-hidden>
            analytics
          </span>
        </div>
        <h1 className="font-bold text-lg tracking-tight text-slate-800">
          <span className="text-[var(--primary)]">yfsc</span>
        </h1>
      </Link>

      <div className="relative" ref={menuRef}>
        <button
          type="button"
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
          onClick={() => setMenuOpen((o) => !o)}
          aria-expanded={menuOpen}
          aria-haspopup="true"
          aria-label="メニューを開く"
        >
          <span className="material-symbols-outlined text-xl">menu</span>
        </button>
        {menuOpen && (
          <nav
            className="absolute right-0 top-full mt-1 py-1 w-48 bg-white border border-[var(--border)] rounded-lg shadow-lg z-50"
            role="menu"
          >
            {NAVIGATION_ITEMS.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm no-underline transition-colors ${
                  location.pathname === item.path
                    ? "bg-[var(--primary)]/10 text-[var(--primary)] font-semibold"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
                role="menuitem"
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
};
