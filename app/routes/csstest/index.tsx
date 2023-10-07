import "./a.css";

import { Link } from "blitz";
import { Something } from "./component.tsx";

export default function () {
  return (
    <div>
      <Something />
      <Link href="/">Click me</Link>
    </div>
  );
}
