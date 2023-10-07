import { action$ } from "slow";

export const useRandomAction = action$(() => {
  console.log("action runs");
  return Math.random();
});
