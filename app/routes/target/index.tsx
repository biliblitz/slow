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
      <Link href="/jump">Go to jump</Link>
    </div>
  );
}
