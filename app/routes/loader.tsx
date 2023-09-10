import { loader$ } from "slow";

export const useRandomLoader = loader$(() => {
  console.log("loader runs");
  return Math.random();
});
