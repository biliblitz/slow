import { loader$ } from "blitz";

export const useSomething = loader$(() => {
  return { something: "you like" };
});
