import { action$ } from "slow";

export const login = action$(() => {
  return { username: "admin", password: "password" };
});
