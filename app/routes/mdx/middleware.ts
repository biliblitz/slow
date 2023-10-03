import { middleware$ } from "slow";

export default middleware$(() => {
  return { a: null };
});
