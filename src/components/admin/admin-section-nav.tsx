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
    <aside className="lg:sticky lg:top-6" data-testid="admin-section-nav">
      <nav aria-label="管理导航" className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--line-soft)] bg-[var(--surface)] shadow-[var(--shadow-subtle)]">
        <div className="hidden border-b border-[var(--line-soft)] px-3.5 py-3 lg:block">
          <p className="text-xs font-semibold text-[var(--muted)]">管理导航</p>
          <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">后台控制台</p>
        </div>

        <div className="grid gap-2 p-3 lg:hidden">
          <label className="text-xs font-semibold text-[var(--muted)]" htmlFor="admin-section-nav-select">
            管理导航
          </label>
          <select
            aria-label="管理导航"
            className="focus-ring min-h-10 w-full rounded-[var(--radius)] border border-[var(--line-soft)] bg-[var(--surface-soft)] px-3.5 py-2 text-sm font-semibold text-[var(--muted-strong)] transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent-strong)]"
            data-testid="admin-section-nav-select"
            id="admin-section-nav-select"
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
        </div>

        <div className="hidden gap-1 p-2 lg:grid" data-testid="admin-section-nav-links">
          {sectionLinks.map((item) => {
            const isActive = activeHref === item.href;

            return (
              <a aria-current={isActive ? "page" : undefined} className={`focus-ring flex min-h-10 items-center rounded-[var(--radius-sm)] px-3 text-sm font-semibold transition ${isActive ? "bg-[var(--accent-soft)] text-[var(--accent-strong)]" : "text-[var(--muted-strong)] hover:bg-[var(--surface-soft)] hover:text-[var(--foreground)]"}`} href={item.href} key={item.href} onClick={() => setActiveHref(item.href)}>
                {item.label}
              </a>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}
