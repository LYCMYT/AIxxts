"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { publicNavItems } from "./nav-config";

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DesktopNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="主导航"
      className="hidden items-center gap-1 rounded-full border border-[var(--line)] bg-[var(--surface)] p-1 md:flex"
    >
      {publicNavItems.map((item) => {
        const Icon = item.icon;
        const active = isActivePath(pathname, item.href);

        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={`focus-ring flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition ${
              active
                ? "bg-[var(--surface-strong)] text-[var(--foreground)]"
                : "text-[var(--muted-strong)] hover:bg-[var(--surface-soft)] hover:text-[var(--foreground)]"
            }`}
            href={item.href}
            key={item.href}
          >
            <Icon size={16} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="移动端主导航"
      className="flex gap-1 overflow-x-auto border-t border-[var(--line)] px-4 py-2 [scrollbar-width:none] md:hidden [&::-webkit-scrollbar]:hidden"
    >
      {publicNavItems.map((item) => {
        const Icon = item.icon;
        const active = isActivePath(pathname, item.href);

        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={`focus-ring flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium ${
              active
                ? "border-[var(--line)] bg-[var(--surface-strong)] text-[var(--foreground)]"
                : "border-[var(--line)] bg-[var(--surface)] text-[var(--muted-strong)]"
            }`}
            href={item.href}
            key={item.href}
          >
            <Icon size={16} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
