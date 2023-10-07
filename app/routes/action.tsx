import { action$ } from "blitz";

export const useRandomAction = action$(() => {
  console.log("action runs");
  return Math.random();
});
