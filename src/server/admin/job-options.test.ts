import assert from "node:assert/strict";
import test from "node:test";
import { AdminJobRequestError, readAdminJobOptions } from "./job-options";

function jsonRequest(body: unknown) {
  return new Request("http://127.0.0.1/api/admin/jobs/test", {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json",
    },
  });
}

test("readAdminJobOptions accepts digest date, limit, selectedOnly, and force", async () => {
  const options = await readAdminJobOptions(
    jsonRequest({
      digestDate: "2026-07-06",
      limit: 20,
      selectedOnly: false,
      force: true,
    }),
  );

  assert.deepEqual(options, {
    digestDate: "2026-07-06",
    limit: 20,
    selectedOnly: false,
    force: true,
  });
});

test("readAdminJobOptions returns empty options for non-json requests", async () => {
  const options = await readAdminJobOptions(
    new Request("http://127.0.0.1/api/admin/jobs/test", {
      method: "POST",
    }),
  );

  assert.deepEqual(options, {});
});

test("readAdminJobOptions rejects invalid job option fields", async () => {
  const cases = [
    {
      body: "{",
      error: "request body must be valid JSON.",
      raw: true,
    },
    {
      body: {
        digestDate: "2026-99-99",
      },
      error: "digestDate must be a valid YYYY-MM-DD date.",
    },
    {
      body: {
        limit: 0,
      },
      error: "limit must be a positive number.",
    },
    {
      body: {
        selectedOnly: "true",
      },
      error: "selectedOnly must be a boolean.",
    },
    {
      body: {
        force: "true",
      },
      error: "force must be a boolean.",
    },
  ];

  for (const item of cases) {
    const request = item.raw
      ? new Request("http://127.0.0.1/api/admin/jobs/test", {
          method: "POST",
          body: item.body as string,
          headers: {
            "content-type": "application/json",
          },
        })
      : jsonRequest(item.body);

    await assert.rejects(readAdminJobOptions(request), (error) => {
      assert.equal(error instanceof AdminJobRequestError, true);
      assert.equal((error as Error).message, item.error);

      return true;
    });
  }
});
