import { loader$ } from "slow";

export const username = loader$(() => {
  return { username: "Alice" };
});

export const user = loader$(() => {
  return { user: "user" };
});
