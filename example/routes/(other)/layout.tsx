import { Outlet, useLoader } from "slow";
import { layoutSomething } from "./loader.ts";

export default function () {
  const something = useLoader(layoutSomething);

  return (
    <div>
      <h2>/(other)</h2>
      <span>{something.data}</span>
      <Outlet />
    </div>
  );
}
