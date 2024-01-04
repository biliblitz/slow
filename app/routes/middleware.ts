import { middleware$ } from "blitz";

export default middleware$((event) => {
  console.log("/middleware.ts");
});
