import { useEffect } from "preact/hooks";
import { Link } from "blitz";

export default function () {
  useEffect(() => {
    console.log("mount /jump/index.tsx");
    return () => console.log("unmount /jump/index.tsx");
  }, []);

  return (
    <div>
      <h1>Jump</h1>
      <Link href="/target">Go to Target</Link>
      <Link href="https://blog.sww.moe/">Go to my blog</Link>
    </div>
  );
}
