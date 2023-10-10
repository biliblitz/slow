import { useEffect } from "preact/hooks";
import { Link } from "blitz";

export default function () {
  useEffect(() => {
    console.log("mount /target/index.tsx");
    return () => console.log("unmount /target/index.tsx");
  }, []);

  return (
    <div>
      <h1>Target</h1>
      <p>
        <Link href="/jump">Go to jump</Link>
      </p>
      <p>
        <Link href="/jump" target="_self">Go to jump _self</Link>
      </p>
      <p>
        <Link href="/jump" target="_blank">Go to jump _blank</Link>
      </p>
    </div>
  );
}
