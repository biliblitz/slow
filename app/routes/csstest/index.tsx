import "./a.css";

import { Link } from "blitz";
import { Something } from "./component.tsx";
import { useRandomCss } from "./loader.ts";
import { useComputed } from "../../../deps.ts";

export default function () {
  const randomCss = useRandomCss();
  const random = useComputed(() => {
    console.log("/csstest/index.tsx loader computed invoked", randomCss.value);
    return randomCss.value + 1;
  });

  return (
    <div>
      <Something />
      <Link href="/">Click me: {random}</Link>
    </div>
  );
}
