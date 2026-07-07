import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { AdminSectionNav } from "./admin-section-nav";

test("AdminDashboard renders a dedicated admin navigation with desktop links and a mobile picker", () => {
  const html = renderToStaticMarkup(<AdminSectionNav />);

  assert.match(html, /管理导航/);
  assert.match(html, /data-testid="admin-section-nav"/);
  assert.match(html, /data-testid="admin-section-nav-links"/);
  assert.match(html, /data-testid="admin-section-nav-select"/);
  assert.match(html, /href="#source-health"/);
});
