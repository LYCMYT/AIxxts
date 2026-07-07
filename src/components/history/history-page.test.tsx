import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { HistoryPage } from "./history-page";

test("HistoryPage renders GET filters and a clear entry for active archive filters", () => {
  const html = renderToStaticMarkup(
    <HistoryPage
      filters={{
        q: "agent memory",
        status: "failed",
      }}
    />,
  );

  assert.match(html, /action="\/digests"/);
  assert.match(html, /method="get"/);
  assert.match(html, /name="q"/);
  assert.match(html, /value="agent memory"/);
  assert.match(html, /name="status"/);
  assert.match(html, /value="failed"/);
  assert.match(html, /href="\/digests"/);
  assert.match(html, /清除筛选/);
});
