import { useComputed } from "../../deps.ts";
import { useManager } from "../manager/index.ts";
import { resolveDependencies } from "../utils.ts";
import { useRouter } from "./router.tsx";

export function RouterHead() {
  const manager = useManager();
  const router = useRouter();

  const deps = useComputed(() => {
    return resolveDependencies(
      manager.buildGraph,
      router.preloads.value
        .map((ref) => manager.imports.get(ref)!)
        .concat(manager.entryPath),
    );
  });

  return (
    <>
      <title>233</title>
      {deps.value.map((dep) => (
        <link key={dep} rel="modulepreload" href={manager.basePath + dep} />
      ))}
    </>
  );
}
