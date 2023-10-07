import "./a.css";

import { Link } from "slow";
import { Something } from "./component.tsx";

export default function () {
  return (
    <div>
      <Something />
      <Link href="/">Click me</Link>
    </div>
  );
}
