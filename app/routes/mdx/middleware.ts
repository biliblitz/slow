import { middleware$ } from "blitz";

export default middleware$(() => {
  console.log("/mdx/middleware.ts");
  return { a: null };
});
