import { Outlet } from "blitz";
import { useEffect } from "preact/hooks";

import "./test.css";
import "./global.css";

export default function () {
  useEffect(() => {
    console.log("mount /layout.tsx");
    return () => console.log("unmount /layout.tsx");
  }, []);

  console.log("render /layout.tsx");

  return (
    <div>
      <header class="h-5 bg-red-500 text-white">
        This is header
      </header>
      <Outlet />
    </div>
  );
}
