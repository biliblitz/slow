import { loader$ } from "slow";

import "http/file_server";

export const layoutSomething = loader$(() => {
  return { data: "routes/(other)/loader.ts" };
});
