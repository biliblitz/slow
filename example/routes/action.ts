import { action$ } from "slow";

export const login = action$(async (req) => {
  const form = await req.formData();
  const username = form.get("username");
  const password = form.get("password");

  if (username === "admin" && password === "password") {
    return { ok: true };
  }

  return { ok: false };
});
