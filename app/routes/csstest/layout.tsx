import { Outlet } from "blitz";
import "./b.css";
import { Something } from "./component.tsx";

export default function () {
  return (
    <div>
      <Something />
      <Outlet />
    </div>
  );
}
