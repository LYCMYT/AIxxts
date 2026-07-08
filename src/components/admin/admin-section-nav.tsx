"use client";

export const adminSectionLinks = [
  { id: "overview", href: "#overview", label: "运行总览", group: "运行" },
  { id: "source-health", href: "#source-health", label: "健康概览", group: "运行" },
  { id: "jobs", href: "#jobs", label: "任务状态", group: "运行" },
  { id: "sources", href: "#sources", label: "数据源", group: "内容" },
  { id: "youtube", href: "#youtube", label: "监听规则", group: "内容" },
  { id: "manual", href: "#manual", label: "手动候选", group: "内容" },
  { id: "topics", href: "#topics", label: "主题管理", group: "内容" },
  { id: "users", href: "#users", label: "用户角色", group: "系统" },
] as const;

export type AdminSectionId = (typeof adminSectionLinks)[number]["id"];

export const defaultAdminSectionId: AdminSectionId = "overview";

const adminSectionGroups = Array.from(new Set(adminSectionLinks.map((item) => item.group)));

export function adminSectionIdFromHash(hash: string): AdminSectionId | null {
  const nextId = hash.replace(/^#/, "");

  return adminSectionLinks.some((item) => item.id === nextId) ? (nextId as AdminSectionId) : null;
}

export function AdminSectionNav({
  activeSectionId,
  onSectionChange,
}: {
  activeSectionId: AdminSectionId;
  onSectionChange: (sectionId: AdminSectionId) => void;
}) {

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
            value={activeSectionId}
            onChange={(event) => {
              onSectionChange(event.currentTarget.value as AdminSectionId);
            }}
          >
            {adminSectionLinks.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div className="hidden gap-3 p-2 lg:grid" data-testid="admin-section-nav-links">
          {adminSectionGroups.map((group) => (
            <div className="grid gap-1" key={group}>
              <p className="px-3 pt-1 text-[11px] font-semibold uppercase tracking-normal text-[var(--muted)]">
                {group}
              </p>
              {adminSectionLinks
                .filter((item) => item.group === group)
                .map((item) => {
                  const isActive = activeSectionId === item.id;

                  return (
                    <a
                      aria-current={isActive ? "page" : undefined}
                      className={`focus-ring flex min-h-10 items-center justify-between rounded-[var(--radius-sm)] px-3 text-sm font-semibold transition ${isActive ? "bg-[var(--accent-soft)] text-[var(--accent-strong)]" : "text-[var(--muted-strong)] hover:bg-[var(--surface-soft)] hover:text-[var(--foreground)]"}`}
                      href={item.href}
                      key={item.id}
                      onClick={(event) => {
                        event.preventDefault();
                        onSectionChange(item.id);
                      }}
                    >
                      {item.label}
                      {isActive ? (
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                      ) : null}
                    </a>
                  );
                })}
            </div>
          ))}
        </div>
      </nav>
    </aside>
  );
}
