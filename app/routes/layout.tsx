import { layout$ } from "blitz";
import { useEffect } from "preact/hooks";

import "./test.css";
import "./global.css";

export default layout$((props) => {
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
      {props.children}
    </div>
  );
});
