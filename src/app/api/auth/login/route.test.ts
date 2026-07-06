import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import * as loginRoute from "./route";

test("login route redirects invalid form credentials back to the login page", async () => {
  const formData = new FormData();
  formData.set("email", "");
  formData.set("password", "");
  formData.set("next", "/admin");

  const response = await loginRoute.POST(
    new NextRequest("http://localhost/api/auth/login", {
      method: "POST",
      body: formData,
    }),
  );

  assert.equal(response.status, 303);
  assert.equal(response.headers.get("location"), "http://localhost/login?auth=invalid&next=%2Fadmin");
});
