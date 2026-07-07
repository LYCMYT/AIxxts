import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { AdminSectionNav } from "./admin-section-nav";

test("AdminDashboard renders compact section navigation instead of a long link strip", () => {
  const html = renderToStaticMarkup(<AdminSectionNav />);

  assert.match(html, /区块导航/);
  assert.match(html, /<select[^>]*aria-label="管理区块"/);
  assert.match(html, /data-testid="admin-section-nav"/);
});
