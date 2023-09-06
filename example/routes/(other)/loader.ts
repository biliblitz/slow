import { loader$ } from "slow";

export const layoutSomething = loader$(() => {
  return { data: "routes/(other)/loader.ts" };
});
