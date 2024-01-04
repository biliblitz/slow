import { loader$ } from "blitz";

export const useRandomCss = loader$(() => {
  return Math.random();
});
