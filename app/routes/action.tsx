import { action$ } from "slow";

export const useRandomAction = action$(() => {
  console.log("action runs");
  console.log(Deno.cwd());
  return Math.random();
});
