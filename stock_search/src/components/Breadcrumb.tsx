import React from "react";
import { Link, useLocation } from "react-router-dom";

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: string;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
}

const routeMap: Record<string, { label: string; icon: string }> = {
  "/": { label: "データビューア", icon: "📊" },
  "/data": { label: "データビューア", icon: "📊" },
  "/about": { label: "このアプリについて", icon: "ℹ️" },
  "/help": { label: "ヘルプ", icon: "❓" },
};

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  const location = useLocation();
  const pathname = location.pathname;

  // カスタムアイテムが提供されていない場合、現在のパスから自動生成
  const breadcrumbItems = items || generateBreadcrumbItems(pathname);

  if (breadcrumbItems.length <= 1) {
    return null; // ホームページのみの場合は表示しない
  }

  return (
    <div className="text-sm breadcrumbs mb-4">
      <ul>
        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1;

          return (
            <li key={index}>
              {isLast ? (
                <span className="flex items-center gap-1 text-base-content/70">
                  {item.icon && <span>{item.icon}</span>}
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.href || "/"}
                  className="flex items-center gap-1 text-primary hover:text-primary-focus transition-colors"
                >
                  {item.icon && <span>{item.icon}</span>}
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

function generateBreadcrumbItems(pathname: string): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = [];

  // ホームは常に含める
  items.push({
    label: "ホーム",
    href: "/",
    icon: "🏠",
  });

  // 現在のページの情報を追加
  const currentRoute = routeMap[pathname];
  if (currentRoute && pathname !== "/") {
    items.push({
      label: currentRoute.label,
      icon: currentRoute.icon,
    });
  }

  return items;
}
