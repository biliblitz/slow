import { middleware$ } from "slow";

export default middleware$(() => {
  console.log("middleware /(other)");
});
