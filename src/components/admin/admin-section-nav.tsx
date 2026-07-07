"use client";

import { useEffect, useState } from "react";

const sectionLinks = [
  { href: "#source-health", label: "健康概览" },
  { href: "#sources", label: "数据源" },
  { href: "#youtube", label: "YouTube 关键词" },
  { href: "#manual", label: "手动候选" },
  { href: "#jobs", label: "任务状态" },
  { href: "#users", label: "用户角色" },
];

export function AdminSectionNav() {
  const [activeHref, setActiveHref] = useState("#source-health");

  useEffect(() => {
    const syncActiveHref = () => {
      const nextHref = window.location.hash;

      if (sectionLinks.some((item) => item.href === nextHref)) {
        setActiveHref(nextHref);
      }
    };

    syncActiveHref();
    window.addEventListener("hashchange", syncActiveHref);

    return () => window.removeEventListener("hashchange", syncActiveHref);
  }, []);

  return (
    <nav
      aria-label="管理区块"
      className="grid gap-2 border-t border-[var(--line-soft)] pt-4 sm:grid-cols-[auto_minmax(220px,320px)] sm:items-center sm:justify-end"
    >
      <span className="text-xs font-semibold text-[var(--muted)]">区块导航</span>
      <select
        aria-label="管理区块"
        className="focus-ring min-h-10 w-full rounded-[var(--radius)] border border-[var(--line-soft)] bg-[var(--surface-soft)] px-3.5 py-2 text-sm font-semibold text-[var(--muted-strong)] transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent-strong)]"
        data-testid="admin-section-nav"
        value={activeHref}
        onChange={(event) => {
          const nextHref = event.currentTarget.value;
          setActiveHref(nextHref);
          window.location.hash = nextHref;
        }}
      >
        {sectionLinks.map((item) => (
          <option key={item.href} value={item.href}>
            {item.label}
          </option>
        ))}
      </select>
    </nav>
  );
}
