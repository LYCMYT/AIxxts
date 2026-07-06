import Link from "next/link";
import { ChartBar, GithubLogo, GlobeHemisphereWest } from "@phosphor-icons/react/dist/ssr";
import { DesktopNav, MobileNav } from "./nav-links";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="page-shell min-h-[100dvh]">
      <a
        className="focus-ring fixed left-4 top-4 z-50 -translate-y-20 rounded-[var(--radius)] bg-[var(--foreground)] px-3 py-2 text-sm font-semibold text-white transition focus-visible:translate-y-0"
        href="#main-content"
      >
        跳到主内容
      </a>
      <header className="sticky top-0 z-30 border-b border-[rgb(210_210_215_/_0.72)] bg-[var(--surface-glass)] backdrop-blur-xl">
        <div className="mx-auto flex h-[60px] w-full max-w-[1180px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link className="focus-ring flex items-center gap-3 rounded-[var(--radius-sm)]" href="/">
            <span className="flex h-[34px] w-[34px] items-center justify-center rounded-[var(--radius-sm)] bg-[var(--foreground)] text-white shadow-[var(--shadow-subtle)]">
              <ChartBar size={19} weight="bold" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold leading-5 tracking-normal">AIxxts</span>
              <span className="hidden text-xs leading-4 text-[var(--muted)] sm:block">
                Xone AI 行业情报
              </span>
            </span>
          </Link>

          <DesktopNav />

          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-2 rounded-full border border-[rgb(210_210_215_/_0.86)] bg-white/70 px-3 py-1.5 text-xs font-medium text-[var(--muted-strong)] shadow-[var(--shadow-subtle)] sm:flex">
              <GlobeHemisphereWest size={15} className="text-[var(--accent)]" />
              开放预览
            </span>
            <a
              aria-label="打开 GitHub 仓库"
              className="focus-ring flex h-9 w-9 items-center justify-center rounded-full border border-[rgb(210_210_215_/_0.86)] bg-white/70 text-[var(--muted-strong)] shadow-[var(--shadow-subtle)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
              href="https://github.com/LYCMYT/AIxxts"
              rel="noreferrer"
              target="_blank"
              title="GitHub"
            >
              <GithubLogo size={18} />
            </a>
          </div>
        </div>

        <MobileNav />
      </header>

      <div id="main-content" tabIndex={-1}>
        {children}
      </div>
    </div>
  );
}
