import { loader$ } from "slow";

export const useSomething = loader$(() => {
  return { something: "you like" };
});
