import assert from "node:assert/strict";
import test from "node:test";
import { requestErrorDiagnostics } from "./request-diagnostics";

test("requestErrorDiagnostics classifies common collector request failures", () => {
  assert.deepEqual(requestErrorDiagnostics(new Error("Request timed out after 20000ms")), {
    category: "网络超时",
    message: "Request timed out after 20000ms",
    retryable: true,
  });
  assert.equal(requestErrorDiagnostics(new Error("fetch failed")).category, "网络连接失败");
  assert.equal(
    requestErrorDiagnostics(new Error("unable to verify the first certificate")).category,
    "TLS/证书错误",
  );
  assert.equal(requestErrorDiagnostics("GitHub API 429: rate limit exceeded.").category, "上游限流");
  assert.equal(requestErrorDiagnostics("HTTP 503 Bad gateway").category, "上游服务错误");
  assert.equal(requestErrorDiagnostics("HTTP 403 forbidden").category, "上游拒绝访问");
});
