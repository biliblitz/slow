import { loader$ } from "blitz";

export const useRandomLoader = loader$(() => {
  console.log("loader runs");
  return Math.random();
});
