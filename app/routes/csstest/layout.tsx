import { Outlet } from "blitz";
import { Something } from "./component.tsx";

import "./b.css";

export default function () {
  return (
    <div>
      <Something />
      <Outlet />
    </div>
  );
}
