import Link from "next/link";
import { ChartBar } from "@phosphor-icons/react/dist/ssr";
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
      <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[rgb(245_245_247_/_0.86)] backdrop-blur-xl">
        <div className="mx-auto flex h-14 w-full max-w-[1180px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link className="focus-ring flex items-center gap-3 rounded-[var(--radius-sm)]" href="/">
            <span className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--foreground)] text-white">
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
        </div>

        <MobileNav />
      </header>

      <div id="main-content" tabIndex={-1}>
        {children}
      </div>
    </div>
  );
}
