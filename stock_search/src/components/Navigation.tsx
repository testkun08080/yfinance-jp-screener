import { Link, useLocation } from "react-router-dom";
import { NAVIGATION_ITEMS } from "../constants/ui";

export const Navigation = () => {
  const location = useLocation();

  const navItems = NAVIGATION_ITEMS;

  return (
    <nav className="navbar bg-base-200 shadow-sm">
      <div className="container mx-auto px-4">
        {/* ロゴ */}
        <div className="navbar-start">
          <Link to="/" className="btn btn-ghost normal-case text-xl">
            <h1 className="text-2xl font-bold">📊 yf x 日本株スクリーニング</h1>
          </Link>
        </div>

        {/* デスクトップメニュー */}
        <div className="navbar-center hidden lg:flex">
          <ul className="menu menu-horizontal px-1">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`gap-2 ${
                    location.pathname === item.path
                      ? "active bg-primary text-primary-content"
                      : ""
                  }`}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* モバイルメニュー */}
        <div className="navbar-end">
          <div className="dropdown dropdown-end lg:hidden">
            <div
              tabIndex={0}
              role="button"
              className="btn btn-ghost"
              aria-label="メニューを開く"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </div>
            <ul
              tabIndex={0}
              className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52"
            >
              {navItems.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`gap-2 ${
                      location.pathname === item.path ? "active" : ""
                    }`}
                  >
                    <span>{item.icon}</span>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </nav>
  );
};
