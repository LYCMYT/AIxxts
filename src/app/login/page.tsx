import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "登录 | AI 行业每日精选",
  description: "AIxxts 管理入口登录",
};

function authMessage(auth: string | undefined) {
  if (auth === "required") {
    return "请先登录管理员账号。";
  }

  if (auth === "forbidden") {
    return "当前账号没有管理员权限，请使用管理员账号登录。";
  }

  if (auth === "invalid") {
    return "账号或密码不正确。";
  }

  return null;
}

function safeNext(value: string | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/api/")) {
    return "/admin";
  }

  return value;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ auth?: string; next?: string }>;
}) {
  const params = await searchParams;
  const nextPath = safeNext(params.next);
  const message = authMessage(params.auth);

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-[var(--background)] px-4 py-10">
      <section className="grid w-full max-w-[420px] gap-6 rounded-[var(--radius-lg)] border border-[var(--line-soft)] bg-[var(--surface)] p-6 shadow-[var(--shadow-subtle)]">
        <div className="grid gap-2">
          <p className="text-sm font-medium text-[var(--accent-strong)]">AIxxts 管理后台</p>
          <h1 className="text-2xl font-semibold tracking-normal">管理员登录</h1>
          <p className="text-sm leading-6 text-[var(--muted)]">
            普通阅读页面可直接访问，管理后台和任务 API 需要管理员会话。
          </p>
        </div>

        {message ? (
          <p className="rounded-[var(--radius)] border border-[var(--warning-soft)] bg-[var(--warning-soft)] px-3 py-2 text-sm leading-6 text-[var(--warning)]">
            {message}
          </p>
        ) : null}

        <form action="/api/auth/login" className="grid gap-4" method="post">
          <input name="next" type="hidden" value={nextPath} />
          <label className="grid gap-2 text-sm font-medium text-[var(--muted-strong)]">
            <span>账号</span>
            <input
              autoComplete="username"
              autoFocus
              className="focus-ring min-h-11 rounded-[var(--radius)] border border-[var(--line-soft)] bg-[var(--surface)] px-3.5 py-2 text-sm text-[var(--foreground)]"
              name="email"
              placeholder="admin"
              required
              type="text"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-[var(--muted-strong)]">
            <span>密码</span>
            <input
              autoComplete="current-password"
              className="focus-ring min-h-11 rounded-[var(--radius)] border border-[var(--line-soft)] bg-[var(--surface)] px-3.5 py-2 text-sm text-[var(--foreground)]"
              name="password"
              placeholder="admin123"
              required
              type="password"
            />
          </label>
          <button
            className="focus-ring inline-flex min-h-11 items-center justify-center rounded-[var(--radius)] bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white shadow-[var(--shadow-subtle)] transition hover:bg-[var(--accent-strong)] active:translate-y-px"
            type="submit"
          >
            登录
          </button>
        </form>
      </section>
    </main>
  );
}
