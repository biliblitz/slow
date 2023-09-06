import { middleware$ } from "slow";

export default middleware$(() => {
  console.log("middlware /(something)");
});
