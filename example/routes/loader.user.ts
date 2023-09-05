import { loader$ } from "slow";

export const user = loader$(() => {
  return { user: "user" };
});
