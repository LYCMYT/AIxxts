import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { AdminSectionLayout, AdminSectionPanel } from "./admin-section-layout";
import { AdminSectionNav } from "./admin-section-nav";

test("AdminDashboard renders a dedicated admin navigation with desktop links and a mobile picker", () => {
  const html = renderToStaticMarkup(
    <AdminSectionNav activeSectionId="source-health" onSectionChange={() => {}} />,
  );

  assert.match(html, /管理导航/);
  assert.match(html, /data-testid="admin-section-nav"/);
  assert.match(html, /data-testid="admin-section-nav-links"/);
  assert.match(html, /data-testid="admin-section-nav-select"/);
  assert.match(html, /href="#overview"/);
  assert.match(html, /href="#source-health"/);
});

test("AdminSectionLayout only renders the active admin section", () => {
  const html = renderToStaticMarkup(
    <AdminSectionLayout>
      <AdminSectionPanel sectionId="overview">
        <div>运行总览内容</div>
      </AdminSectionPanel>
      <AdminSectionPanel sectionId="source-health">
        <div>健康概览内容</div>
      </AdminSectionPanel>
      <AdminSectionPanel sectionId="sources">
        <div>数据源内容</div>
      </AdminSectionPanel>
    </AdminSectionLayout>,
  );

  assert.match(html, /data-testid="admin-section-content"/);
  assert.match(html, /data-section-id="overview"/);
  assert.match(html, /运行总览内容/);
  assert.doesNotMatch(html, /健康概览内容/);
  assert.doesNotMatch(html, /数据源内容/);
});
