import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { GithubPagesSnapshot } from "./github-pages-data";

const SNAPSHOT_PATH = path.resolve("public/github-pages-snapshot.json");
const OUT_DIR = path.resolve("out");

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDateTime(value: string) {
  if (!value) {
    return "未记录";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/New_York",
  }).format(date);
}

function slug(value: string) {
  return encodeURIComponent(value);
}

function css() {
  return `
    :root {
      color-scheme: light;
      --background: #f5f5f7;
      --surface: #ffffff;
      --surface-soft: #f8f9fb;
      --foreground: #111827;
      --muted: #667085;
      --line: #e5e7eb;
      --accent: #0a66d8;
      --accent-soft: #eaf3ff;
      --shadow: 0 18px 45px rgba(15, 23, 42, 0.07);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: var(--background);
      color: var(--foreground);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      letter-spacing: 0;
    }
    a { color: inherit; text-decoration: none; }
    .shell { max-width: 1280px; margin: 0 auto; padding: 24px 32px 48px; }
    .topbar { display: flex; align-items: center; justify-content: space-between; gap: 24px; margin-bottom: 18px; }
    .brand { display: flex; align-items: center; gap: 10px; font-weight: 700; }
    .logo { display: grid; place-items: center; width: 30px; height: 30px; border-radius: 8px; background: #111827; color: #fff; }
    .nav { display: flex; gap: 8px; }
    .pill { border: 1px solid var(--line); border-radius: 999px; padding: 7px 12px; color: var(--muted); background: var(--surface); font-size: 13px; font-weight: 600; }
    .hero, .panel, .card {
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: 16px;
      box-shadow: var(--shadow);
    }
    .hero { padding: 28px; display: grid; grid-template-columns: minmax(0, 1fr) 440px; gap: 28px; align-items: end; }
    .eyebrow { color: var(--accent); font-size: 13px; font-weight: 700; margin: 0 0 10px; }
    h1 { font-size: 40px; line-height: 1.08; margin: 0; }
    h2 { font-size: 18px; margin: 0; }
    h3 { font-size: 16px; margin: 0; }
    p { margin: 0; }
    .subcopy { color: var(--muted); line-height: 1.75; margin-top: 12px; max-width: 760px; }
    .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
    .stat { background: var(--surface-soft); border: 1px solid var(--line); border-radius: 12px; padding: 12px; }
    .stat span { display: block; color: var(--muted); font-size: 12px; margin-bottom: 6px; }
    .stat strong { font-size: 17px; }
    .section-head { display: flex; align-items: end; justify-content: space-between; gap: 18px; margin: 18px 0 12px; }
    .section-head p { color: var(--muted); font-size: 14px; margin-top: 5px; }
    .topics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 12px; }
    .topic { padding: 10px 12px; border: 1px solid var(--line); background: var(--surface); border-radius: 12px; }
    .topic-row { display: flex; justify-content: space-between; gap: 12px; font-size: 12px; font-weight: 700; }
    .bar { height: 6px; border-radius: 99px; background: #eef2f7; overflow: hidden; margin-top: 8px; }
    .bar span { display: block; height: 100%; background: var(--accent); border-radius: inherit; }
    .list { display: grid; gap: 12px; }
    .card { display: grid; grid-template-columns: 42px minmax(0, 1fr) 290px; gap: 18px; padding: 18px; box-shadow: none; }
    .rank { display: grid; place-items: center; width: 34px; height: 34px; border: 1px solid var(--line); border-radius: 50%; background: var(--surface-soft); font-weight: 800; }
    .meta { display: flex; flex-wrap: wrap; gap: 6px; color: var(--muted); font-size: 12px; margin-bottom: 10px; }
    .tag { display: inline-flex; align-items: center; border: 1px solid var(--line); border-radius: 999px; background: var(--surface-soft); padding: 4px 8px; font-size: 12px; color: var(--muted); font-weight: 600; }
    .tag.blue { color: var(--accent); background: var(--accent-soft); border-color: var(--accent-soft); }
    .title { font-size: 17px; font-weight: 800; line-height: 1.45; }
    .summary { color: #344054; line-height: 1.7; margin-top: 8px; font-size: 14px; }
    .side { display: grid; align-content: start; gap: 8px; }
    .button { display: inline-flex; width: fit-content; align-items: center; border: 1px solid var(--line); border-radius: 999px; padding: 8px 12px; color: var(--accent); font-size: 13px; font-weight: 800; background: var(--surface); }
    .detail { max-width: 980px; }
    .detail .hero { display: block; }
    .article { margin-top: 16px; padding: 28px; }
    .article p { color: #344054; line-height: 1.9; margin: 12px 0; }
    .footer { color: var(--muted); font-size: 12px; margin-top: 24px; text-align: center; }
  `;
}

function page(title: string, body: string) {
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>${css()}</style>
</head>
<body>${body}</body>
</html>
`;
}

function topicCounts(snapshot: GithubPagesSnapshot) {
  const counts = new Map<string, number>();

  for (const item of snapshot.items) {
    for (const topic of item.topicTags) {
      counts.set(topic, (counts.get(topic) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .map(([label, count]) => ({ count, label, percent: snapshot.items.length ? Math.round((count / snapshot.items.length) * 100) : 0 }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label))
    .slice(0, 8);
}

function layout(content: string, active: "home" | "items" = "home") {
  return `<div class="shell">
    <header class="topbar">
      <a class="brand" href="./"><span class="logo">A</span><span>AIxxts</span></a>
      <nav class="nav" aria-label="主导航">
        <a class="pill" href="./">${active === "home" ? "今日精选" : "返回今日精选"}</a>
        <span class="pill">GitHub Pages 静态阅读版</span>
      </nav>
    </header>
    ${content}
  </div>`;
}

function renderIndex(snapshot: GithubPagesSnapshot) {
  const digest = snapshot.digest;
  const topics = topicCounts(snapshot);

  if (!digest) {
    return page(
      "AIxxts",
      layout(`<section class="hero"><div><p class="eyebrow">AIxxts</p><h1>暂无已发布每日精选</h1><p class="subcopy">请先在本地或服务器生成并发布日报，再导出 GitHub Pages snapshot。</p></div></section>`),
    );
  }

  const topicHtml = topics
    .map(
      (topic) => `<div class="topic"><div class="topic-row"><span>${escapeHtml(topic.label)}</span><span>${topic.count} 条</span></div><div class="bar"><span style="width:${topic.percent}%"></span></div></div>`,
    )
    .join("");

  const itemsHtml = snapshot.items
    .map(
      (item) => `<article class="card">
        <div><span class="rank">${item.rank}</span></div>
        <div>
          <div class="meta">
            <span class="tag">${escapeHtml(item.source)}</span>
            <span class="tag">${escapeHtml(item.sourceType)}</span>
            <span class="tag">${escapeHtml(formatDateTime(item.publishedAt))}</span>
            <span class="tag blue">站内详情</span>
          </div>
          <a class="title" href="./items/${slug(item.id)}/">${escapeHtml(item.title)}</a>
          <p class="summary"><strong>AI 解读：</strong>${escapeHtml(item.interpretation)}</p>
        </div>
        <div class="side">
          <div>${item.topicTags.slice(0, 4).map((topic) => `<span class="tag blue">${escapeHtml(topic)}</span>`).join(" ")}</div>
          ${item.signals.slice(0, 3).map((signal) => `<span class="tag">${escapeHtml(signal)}</span>`).join("")}
          <a class="button" href="./items/${slug(item.id)}/">查看详情 →</a>
        </div>
      </article>`,
    )
    .join("");

  return page(
    `${digest.title} - AIxxts`,
    layout(`<section class="hero">
      <div>
        <p class="eyebrow">${escapeHtml(digest.status)} · 内部情报工作台</p>
        <h1>今日精选</h1>
        <p class="subcopy">${escapeHtml(digest.summary || "按影响力、社区热度、新鲜度和多源可信度排序，帮助团队快速扫读今天最值得关注的 AI 行业动态。")}</p>
      </div>
      <div class="stats">
        <div class="stat"><span>日期</span><strong>${escapeHtml(digest.date)}</strong></div>
        <div class="stat"><span>生成时间</span><strong>${escapeHtml(formatDateTime(digest.generatedAt))}</strong></div>
        <div class="stat"><span>精选 / 候选</span><strong>${digest.selectedCount} / ${digest.candidateCount}</strong></div>
      </div>
    </section>
    <div class="section-head"><div><h2>排序列表</h2><p>${digest.selectedCount} 条精选，来自真实候选池导出。</p></div><span class="pill">导出时间：${escapeHtml(formatDateTime(snapshot.exportedAt))}</span></div>
    <section class="topics">${topicHtml}</section>
    <section class="list">${itemsHtml}</section>
    <p class="footer">GitHub Pages 静态阅读版仅展示公开精选内容；后台、采集、登录和定时任务仍在服务器环境运行。</p>`),
  );
}

function renderItem(snapshot: GithubPagesSnapshot, item: GithubPagesSnapshot["items"][number]) {
  const bodyText = item.translatedContent || item.translatedSummary || item.originalSummary || item.interpretation;
  const paragraphs = bodyText
    .split(/\n{2,}|(?<=。)/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join("");

  return page(
    `${item.title} - AIxxts`,
    layout(
      `<main class="detail">
        <section class="hero">
          <p class="eyebrow">#${item.rank} · ${escapeHtml(item.source)} · ${escapeHtml(formatDateTime(item.publishedAt))}</p>
          <h1>${escapeHtml(item.title)}</h1>
          <p class="subcopy">${escapeHtml(item.interpretation)}</p>
          <p class="subcopy">${item.topicTags.map((topic) => `<span class="tag blue">${escapeHtml(topic)}</span>`).join(" ")}</p>
        </section>
        <section class="article panel">
          <h2>中文详情</h2>
          ${paragraphs}
          <p><a class="button" href="${escapeHtml(item.originalUrl)}" rel="noreferrer" target="_blank">打开原文 →</a></p>
        </section>
      </main>
      <p class="footer">Snapshot: ${escapeHtml(formatDateTime(snapshot.exportedAt))}</p>`,
      "items",
    ),
  );
}

function main() {
  if (!existsSync(SNAPSHOT_PATH)) {
    throw new Error(`Missing ${SNAPSHOT_PATH}. Run pnpm snapshot:pages first.`);
  }

  const snapshot = JSON.parse(readFileSync(SNAPSHOT_PATH, "utf8")) as GithubPagesSnapshot;

  rmSync(OUT_DIR, { force: true, recursive: true });
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(path.join(OUT_DIR, ".nojekyll"), "", "utf8");
  writeFileSync(path.join(OUT_DIR, "index.html"), renderIndex(snapshot), "utf8");
  copyFileSync(SNAPSHOT_PATH, path.join(OUT_DIR, "github-pages-snapshot.json"));

  for (const item of snapshot.items) {
    const itemDir = path.join(OUT_DIR, "items", slug(item.id));
    mkdirSync(itemDir, { recursive: true });
    writeFileSync(path.join(itemDir, "index.html"), renderItem(snapshot, item), "utf8");
  }

  console.log(`Built GitHub Pages static site with ${snapshot.items.length} items at ${OUT_DIR}`);
}

main();

